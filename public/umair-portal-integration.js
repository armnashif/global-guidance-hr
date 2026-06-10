/**
 * Umair Staff Portal - Google Sheets Integration
 * Source Sheet: https://docs.google.com/spreadsheets/d/1bTBIXZAlK0Z-EgIxAOWviY_-oETih07KtMOWgFmL9ew/edit
 * 
 * IMPORTANT SETUP INSTRUCTIONS:
 * 1. Create Google Apps Script Web App from the spreadsheet
 * 2. Deploy as web app with "Anyone" access
 * 3. Replace APPS_SCRIPT_URL below with your deployment URL
 * 4. Required sheet tabs: Staff, Attendance, Applications, Offers
 */

// Configuration
const GOOGLE_SHEET_ID = '1bTBIXZAlK0Z-EgIxAOWviY_-oETih07KtMOWgFmL9ew';

// Apps Script Web App URL - MUST BE CONFIGURED
// Deploy the Apps Script, then paste the deployment URL here
const APPS_SCRIPT_URL = localStorage.getItem('APPS_SCRIPT_URL') || 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

// Cache management
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = {
    data: {},
    timestamps: {}
};

/**
 * Fetch data from Google Sheet via Apps Script
 */
async function fetchSheetData(tabName, useCache = true) {
    // Check cache
    if (useCache && cache.data[tabName] && 
        (Date.now() - cache.timestamps[tabName] < CACHE_DURATION)) {
        console.log(`Using cached data for ${tabName}`);
        return cache.data[tabName];
    }
    
    try {
        const url = `${APPS_SCRIPT_URL}?action=read&sheet=${encodeURIComponent(tabName)}`;
        console.log(`Fetching ${tabName} from:`, url);
        
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        const data = result.data || [];
        
        // Update cache
        cache.data[tabName] = data;
        cache.timestamps[tabName] = Date.now();
        
        console.log(`Fetched ${data.length} rows from ${tabName}`);
        return data;
        
    } catch (error) {
        console.error(`Error fetching ${tabName}:`, error);
        
        // Return cached data if available, even if expired
        if (cache.data[tabName]) {
            console.warn(`Using stale cache for ${tabName}`);
            return cache.data[tabName];
        }
        
        // Return empty array as fallback
        return [];
    }
}

/**
 * Write data to Google Sheet via Apps Script
 */
async function writeToSheet(tabName, rowData) {
    try {
        const url = `${APPS_SCRIPT_URL}`;
        
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'write',
                sheet: tabName,
                data: rowData
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        // Invalidate cache for this sheet
        delete cache.data[tabName];
        delete cache.timestamps[tabName];
        
        console.log(`Successfully wrote to ${tabName}`);
        return result;
        
    } catch (error) {
        console.error(`Error writing to ${tabName}:`, error);
        throw error;
    }
}

/**
 * Update existing row in Google Sheet
 */
async function updateSheetRecord(tabName, rowIndex, rowData) {
    try {
        const url = `${APPS_SCRIPT_URL}`;
        
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'update',
                sheet: tabName,
                rowIndex: rowIndex,
                data: rowData
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        // Invalidate cache
        delete cache.data[tabName];
        delete cache.timestamps[tabName];
        
        console.log(`Successfully updated row ${rowIndex} in ${tabName}`);
        return result;
        
    } catch (error) {
        console.error(`Error updating ${tabName}:`, error);
        throw error;
    }
}

/**
 * Get staff member by email - LOGIN AUTHENTICATION
 */
async function getStaffUserByEmail(email) {
    try {
        const staffData = await fetchSheetData('Staff', false); // Don't cache login attempts
        
        if (!staffData || staffData.length === 0) {
            console.error('No staff data found in sheet');
            return null;
        }
        
        // Find staff by email (case-insensitive)
        const normalizedEmail = email.toLowerCase().trim();
        const staff = staffData.find(s => 
            s.Email && s.Email.toLowerCase().trim() === normalizedEmail
        );
        
        if (!staff) {
            console.log('Staff not found for email:', email);
            return null;
        }
        
        // Check if staff is active
        const status = (staff.Status || '').toLowerCase();
        if (status === 'inactive' || status === 'terminated') {
            console.log('Staff account is inactive');
            return null;
        }
        
        return {
            id: staff.StaffID || staff.ID || staff.Email,
            name: staff.Name || staff.FullName || 'Unknown',
            email: staff.Email,
            role: staff.Role || staff.Position || 'Staff',
            status: staff.Status || 'Active',
            department: staff.Department || 'Admissions',
            password: staff.Password || null // For validation
        };
        
    } catch (error) {
        console.error('Error in getStaffUserByEmail:', error);
        return null;
    }
}

/**
 * Fetch Umair's attendance records
 */
async function fetchUmairAttendance(staffId, staffName) {
    try {
        const attendanceData = await fetchSheetData('Attendance');
        
        return attendanceData.filter(record => {
            // Match by staff ID, name, or email
            return record.StaffID === staffId || 
                   record.StaffName === staffName ||
                   record.Email === staffId;
        }).map(record => ({
            date: record.Date || '',
            timeIn: record.TimeIn || record.CheckIn || '',
            timeOut: record.TimeOut || record.CheckOut || '',
            workMode: record.WorkMode || record.Mode || 'Office',
            location: record.Location || '',
            latitude: record.Latitude || '',
            longitude: record.Longitude || '',
            notes: record.Notes || '',
            _rowIndex: record._rowIndex // For updates
        }));
        
    } catch (error) {
        console.error('Error fetching attendance:', error);
        return [];
    }
}

/**
 * Fetch Umair's applications
 */
async function fetchUmairApplications(staffId, staffName) {
    try {
        const applicationsData = await fetchSheetData('Applications');
        
        return applicationsData.filter(app => {
            // Match by various possible column names
            return app.Handler === staffId || 
                   app.Handler === staffName ||
                   app.Owner === staffId ||
                   app.Owner === staffName ||
                   app.Counselor === staffId ||
                   app.Counselor === staffName ||
                   app.AssignedTo === staffId ||
                   app.AssignedTo === staffName;
        }).map(app => ({
            id: app.ApplicationID || app.ID || `APP-${Date.now()}`,
            studentName: app.StudentName || app.Name || 'Unknown',
            course: app.Course || app.Program || '',
            university: app.University || app.Institution || '',
            intake: app.Intake || '',
            country: app.Country || '',
            source: app.Source || app.ApplicationSource || 'Direct',
            partnerName: app.PartnerName || app.Partner || '',
            status: app.Status || 'New',
            receivedDate: app.ReceivedDate || app.ApplicationDate || '',
            submittedDate: app.SubmittedDate || '',
            caseStatus: app.CaseStatus || 'Active',
            _rowIndex: app._rowIndex
        }));
        
    } catch (error) {
        console.error('Error fetching applications:', error);
        return [];
    }
}

/**
 * Fetch Umair's offers
 */
async function fetchUmairOffers(staffId, staffName) {
    try {
        const offersData = await fetchSheetData('Offers');
        
        return offersData.filter(offer => {
            return offer.Handler === staffId || 
                   offer.Handler === staffName ||
                   offer.Owner === staffId ||
                   offer.Owner === staffName ||
                   offer.Counselor === staffId ||
                   offer.Counselor === staffName;
        }).map(offer => ({
            id: offer.OfferID || offer.ID || `OFFER-${Date.now()}`,
            applicationId: offer.ApplicationID || '',
            studentName: offer.StudentName || 'Unknown',
            offerStatus: offer.OfferStatus || offer.Status || '',
            conditions: offer.Conditions || '',
            offerDate: offer.OfferDate || '',
            university: offer.University || '',
            country: offer.Country || '',
            intake: offer.Intake || '',
            actionTaken: offer.ActionTaken || '',
            _rowIndex: offer._rowIndex
        }));
        
    } catch (error) {
        console.error('Error fetching offers:', error);
        return [];
    }
}

/**
 * Calculate today's summary metrics
 */
async function calculateTodaySummary(staffId, staffName) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const todayVariations = [
            today,
            new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
            new Date().toLocaleDateString('en-US')  // MM/DD/YYYY
        ];
        
        const applications = await fetchUmairApplications(staffId, staffName);
        const offers = await fetchUmairOffers(staffId, staffName);
        
        // New applications received today
        const newAppsToday = applications.filter(app => {
            const receivedDate = (app.receivedDate || '').split('T')[0];
            return todayVariations.some(d => receivedDate === d || receivedDate.includes(d));
        }).length;
        
        // Applications submitted today
        const submittedToday = applications.filter(app => {
            const submittedDate = (app.submittedDate || '').split('T')[0];
            return todayVariations.some(d => submittedDate === d || submittedDate.includes(d));
        }).length;
        
        // Conditional offers received today
        const conditionalOffersToday = offers.filter(offer => {
            const offerDate = (offer.offerDate || '').split('T')[0];
            const isToday = todayVariations.some(d => offerDate === d || offerDate.includes(d));
            const isConditional = (offer.offerStatus || '').toLowerCase().includes('conditional') ||
                                (offer.offerStatus || '').toLowerCase().includes('cond');
            return isToday && isConditional;
        });
        
        // Group by country and university
        const byCountry = {};
        const byUniversity = {};
        
        conditionalOffersToday.forEach(offer => {
            const country = offer.country || 'Unknown';
            const university = offer.university || 'Unknown';
            
            byCountry[country] = (byCountry[country] || 0) + 1;
            byUniversity[university] = (byUniversity[university] || 0) + 1;
        });
        
        return {
            newAppsReceived: newAppsToday,
            appsSubmitted: submittedToday,
            conditionalOffers: conditionalOffersToday.length,
            offersByCountry: byCountry,
            offersByUniversity: byUniversity,
            lastRefreshed: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Error calculating summary:', error);
        return {
            newAppsReceived: 0,
            appsSubmitted: 0,
            conditionalOffers: 0,
            offersByCountry: {},
            offersByUniversity: {},
            lastRefreshed: new Date().toISOString()
        };
    }
}

/**
 * Get current location using browser Geolocation API
 */
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported by browser'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            position => {
                resolve({
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6),
                    accuracy: Math.round(position.coords.accuracy),
                    timestamp: new Date().toISOString()
                });
            },
            error => {
                console.error('Geolocation error:', error);
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    });
}

/**
 * Reverse geocode lat/lng to address (using Nominatim - free, no API key)
 */
async function reverseGeocode(latitude, longitude) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
                headers: {
                    'User-Agent': 'Global Guidance Staff Portal'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Geocoding failed');
        }
        
        const data = await response.json();
        return data.display_name || `${latitude}, ${longitude}`;
        
    } catch (error) {
        console.error('Reverse geocode error:', error);
        return `${latitude}, ${longitude}`;
    }
}

/**
 * Check in - record attendance with location
 */
async function checkIn(staffId, staffName, workMode = 'Office') {
    try {
        // Get location
        let locationData = {
            latitude: '',
            longitude: '',
            address: 'Location not available'
        };
        
        try {
            const location = await getCurrentLocation();
            locationData.latitude = location.latitude;
            locationData.longitude = location.longitude;
            locationData.address = await reverseGeocode(location.latitude, location.longitude);
        } catch (locError) {
            console.warn('Location not available:', locError.message);
            // Continue without location
        }
        
        // Prepare attendance record
        const now = new Date();
        const attendanceRecord = {
            StaffID: staffId,
            StaffName: staffName,
            Date: now.toISOString().split('T')[0], // YYYY-MM-DD
            TimeIn: now.toTimeString().split(' ')[0], // HH:MM:SS
            TimeOut: '',
            WorkMode: workMode,
            Location: locationData.address,
            Latitude: locationData.latitude,
            Longitude: locationData.longitude,
            Notes: `Check-in via portal at ${now.toLocaleString()}`
        };
        
        // Write to sheet
        await writeToSheet('Attendance', attendanceRecord);
        
        return {
            success: true,
            message: 'Checked in successfully',
            data: attendanceRecord
        };
        
    } catch (error) {
        console.error('Check-in error:', error);
        throw error;
    }
}

/**
 * Check out - update attendance record
 */
async function checkOut(staffId, staffName) {
    try {
        // Get today's attendance records
        const attendance = await fetchUmairAttendance(staffId, staffName);
        const today = new Date().toISOString().split('T')[0];
        
        // Find today's record that doesn't have a checkout time
        const todayRecord = attendance.find(record => 
            record.date === today && !record.timeOut
        );
        
        if (!todayRecord) {
            throw new Error('No active check-in found for today');
        }
        
        // Update with checkout time
        const now = new Date();
        const updatedRecord = {
            ...todayRecord,
            TimeOut: now.toTimeString().split(' ')[0],
            Notes: (todayRecord.notes || '') + ` | Check-out at ${now.toLocaleString()}`
        };
        
        await updateSheetRecord('Attendance', todayRecord._rowIndex, updatedRecord);
        
        return {
            success: true,
            message: 'Checked out successfully',
            data: updatedRecord
        };
        
    } catch (error) {
        console.error('Check-out error:', error);
        throw error;
    }
}

/**
 * Clear cache - force refresh data
 */
function clearCache() {
    cache.data = {};
    cache.timestamps = {};
    console.log('Cache cleared');
}

/**
 * Check if Apps Script is configured
 */
function isConfigured() {
    return !APPS_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID');
}

/**
 * Set Apps Script URL
 */
function setAppsScriptUrl(url) {
    localStorage.setItem('APPS_SCRIPT_URL', url);
    window.location.reload();
}

// Export API
window.UmairPortalAPI = {
    // Authentication
    getStaffUserByEmail,
    
    // Data fetching
    fetchUmairAttendance,
    fetchUmairApplications,
    fetchUmairOffers,
    calculateTodaySummary,
    
    // Location
    getCurrentLocation,
    reverseGeocode,
    
    // Attendance
    checkIn,
    checkOut,
    
    // Sheet operations
    writeToSheet,
    updateSheetRecord,
    
    // Utility
    clearCache,
    isConfigured,
    setAppsScriptUrl,
    
    // Configuration
    GOOGLE_SHEET_ID,
    APPS_SCRIPT_URL
};

console.log('✅ Umair Portal API loaded successfully');
console.log('Sheet ID:', GOOGLE_SHEET_ID);
console.log('Apps Script configured:', isConfigured());
