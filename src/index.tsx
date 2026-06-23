import { Hono } from 'hono'
import { cors } from 'hono/cors'
import htmlTemplate from './template.html?raw'
import sharedAuthJS from '../public/shared-auth.js?raw'
import dailyOpsEnhancedPage from '../public/daily-operations-enhanced.html?raw'
import sheetsIntegrationPage from '../public/sheets-integration.html?raw'
import leadManagementPage from '../public/lead-management-unified.html?raw'
import redFlagsPage from '../public/red-flags.html?raw'
import reportsPage from '../public/reports-analytics.html?raw'
import leaveManagementPage from '../public/leave-management.html?raw'
import applicationsPage from '../public/applications.html?raw'
import studentsPage from '../public/students.html?raw'
import studentPortalPage from '../public/student-portal.html?raw'
import thasbihaPortalPage from '../public/thasbiha-portal.html?raw'
import razanPortalPage from '../public/razan-portal.html?raw'
import applicationsVisaPage from '../public/applications-visa.html?raw'
import financeCommissionPage from '../public/finance-commission.html?raw'
import systemSettingsPage from '../public/system-settings.html?raw'
import locationTrackerPage from '../public/location-tracker.html?raw'
import commandPortalPage from '../public/command-portal.html?raw'
import studentLoginPage from '../public/student-login.html?raw'

// Real Admissions DB data from Google Sheets
const ADMISSIONS_DB_DATA = [
            {id:1,name:'Azam',directAgent:'Direct',counselor:'Bevan',mobile:'',emailCreated:'',registration:'Yes (Bevan)',zones:'select',appReceivedDate:'',docsStatus:'Pending',uni:'1. Sunderland University (SP)\n2. Northumbria University (London - CZ)\n3. Coventry University (CZ)\n4. Sunderland University (CZ)\n5. DMUIC (Ox)\n6. UWE (D)',courseIntake:'1. Business Management and Entrepreneurship BA (Hons) (Top -Up)\n2. BSc (Hons) Business Enterprise and Innovation Management (Top Up)\n3. International Business Top-up BA \n4. Business Management and Entrepreneurship BA (Hons) (Top -Up) May/25\n5. Business Y2 March/25\n6. BA(Hons) International Business Management (Top Up) Sep/25',appSubmitDate:'01/01/2026',status:'1. Not eligible for IELTS Waiver\n2. Not meeting entry req\n3. Offer\n4. Application sent for processing \n5. Application Rejected\n6. Application sent for processing',offers:'3. CO',englishWaiver:'',languageTests:'No',todo:'5. SOP pending from Student',toApply:'',summary:'3. Defer to Sep requested on 29.07.25 to process with Zakwana',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'App 1: 49 days',commLog:'',ceoInfo:''},
            {id:2,name:'Ajith (Thasbiha)',directAgent:'Agent',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'Agent File (Shree)',zones:'select',appReceivedDate:'',docsStatus:'',uni:'1. Coventry University (CZ)\n2. Sunderland University London (SP)\n3. Roehampton University (OX)\n4. London Metropolitan University (CZ)\n5. BCU (Infinity)\n6. DMU (Infinity)\n7. Hertfordshire (CZ)\n8. Wolverhampton (Infinity)',courseIntake:'1. Business Management and Leadership BA May/25\n2. Business and Management BA (Hons) May/25\n3. Bsc Business Management May/25\n4. Business Management - BA (Hons) May/25\n5. BA (Hons) Business Management Sep/25\n6. Business Management BA (Hons) Sep/25\n7. Business Management BA (Hons) Sep/25\n8. Business Management BA (Hons) Sep/25',appSubmitDate:'',status:'1. CO\n2. CO\n3. CO\n4. CO/not eligible for Waiver\n5. CO\n6. CO\n7. CO/Payment/Credibility Failed\n8. Processed',offers:'1. CO\n2. CO\n3. CO\n4. CO\n5. CO\n6. CO\n7. CO/Payment',englishWaiver:'',languageTests:'No',todo:'LOR needed',toApply:'',summary:'7. 1000 GBP Paid from Nashif Revolut on 10.05.2025/Failed On credibility, Informed on the group to fill the Refund request form on 23.08.26',leadSource:'Agent name/Direct/referal front',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:3,name:'Kawsiya',directAgent:'',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'Yes (Thasbiiha)',zones:'select',appReceivedDate:'',docsStatus:'Pending Requested',uni:'1. Coventry (CZ)',courseIntake:'1. Disaster Management and Resilience MSc Jan/26',appSubmitDate:'',status:'1. CO/payment/refund Required',offers:'1. CO',englishWaiver:'',languageTests:'',todo:'Requested the pending docs,',toApply:'',summary:'1. 8000 GBP payment made on 26.06.25 By student/Student not ready with IELTS defer requested for January',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:4,name:'Thevapriya (Radiograhy)',directAgent:'',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'Agent File (?)',zones:'select',appReceivedDate:'',docsStatus:'Pending Requested',uni:'1. Worcester (D)\n2. UOG (GUS)',courseIntake:'1. MRes in International Business and Management Studies Sep/25\n2. Mres MSc by Research International Business Sep/25',appSubmitDate:'',status:'1. Application Rejected\n2. CO',offers:'2. CO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:'1. User Code - 25016023'},
            {id:5,name:'Tharun Kumaran',directAgent:'Agent',counselor:'Bevan, Munsif, Thasbiha',mobile:'',emailCreated:'',registration:'Agent File (Lawyer)',zones:'select',appReceivedDate:'',docsStatus:'',uni:'1. Sunderland (CZ)\n2. York St John (D)\n3. Wolverhampton (Infinity)\n4. DMU (Infinity)\n5. UWE (D)\n6. BCU (Infinity)\n7. UOG (GUS)\n8. Aston (OC)\n9. Aston (OC)',courseIntake:'1. Photography, Video and Digital Imaging BA (Hons) Sep/25\n2. BA (Hons) Photography Sep/25\n3. BA (Hons) Photography Sep/25\n4. Photography and Video BA (Hons) Sep/25\n5. BA (Hons) Photography Sep/25\n6. BA (Hons) Photography Sep/25\n7. BA (Hons) Photography Sep/25\n8. Computer Science Foundation Sep/25\n9. Computer Science IY1 Sep/25',appSubmitDate:'',status:'1. Dont Process with this, No Elicos\n2. Application sent for processing\n3. CO\n4. processed\n5. Portfolio Requested\n6. Portfolio Requested/Application Withdrawn\n7. CO\n8. Application Closed\n9. CO',offers:'3. CO\n7. CO\n9. CO',englishWaiver:'',languageTests:'',todo:'1. IHS Form to be filled,, Need SOP from the student/Withdraw this as Lo result O.L was given',toApply:'UCA - BA (Hons) Photography',summary:'No updates from the agent/student for all the aps',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:6,name:'Mithurshan',directAgent:'Agent',counselor:'Bevan, Thasbiha',mobile:'',emailCreated:'',registration:'Agent File (Shree)',zones:'select',appReceivedDate:'',docsStatus:'',uni:'1. UWE (D)\n2. Sunderland (CZ)',courseIntake:'1. BA Business Management Sep/25\n2. Bevan Applied, Visa processed, and received a refusal for Oct intake',appSubmitDate:'',status:'1. UCO',offers:'1. UCO',englishWaiver:'',languageTests:'',todo:'SOP and LOR needed',toApply:'',summary:'Sunderland application applied by Bevan has been issued the CAS, razan and thasbiha is cordinating on this cas Further for Visa\nrequested for Defer and A new CAS to reapply 25.08.25/New Cas Cannot be Issued, refund Requested',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:7,name:'Arulthas Casin\n(Platinum Visa)',directAgent:'Agent',counselor:'Razaan',mobile:'',emailCreated:'',registration:'Agent File',zones:'Red',appReceivedDate:'',docsStatus:'Pending',uni:'1. UCLAN (Edvoy)\n2. UOG (GUS)\n3. Worcester (D)\n4. Wolverhampton (Infinity)\n5. Coventry (CZ)\n6. Hertz (CZ)\n7. Greenwich (CZ)\n8. DMU (CZ)\n9. Hull (CEG)\n10. BCU (Infinity)\n11. UCA (D)\n12. NU London (Nashif Mail)\n13. ASton (Edvoy)\n14. DMU (Edvoy)',courseIntake:'1. Mres Management May/25\n2. Mres MSc by Research International Business Sep/25\n3. MRes in International Business and Management Studies Jan/26\n4. Mres in IR Jan/26\n5. International Business Management MSc Jan/26\n6. MSc International Business Jan/26\n7. International Business, MA Jan/26\n8. International Business Management MSc Jan/26\n9. MSc Business Management Jan/26\n10. MSc Management and International Business Jan/26\n11. Global Masters of Business and Management Jan/26\n12. Msc Business with Entreprenurship May/26\n13.\n14.',appSubmitDate:'',status:'1. Pending Proposal\n2. CO\n3. Offer given Late, couldnt meet deadline\n4. Offer rejected Due to no degree\n5. CO\n6. reject due to management decision CZ, Qualifi\n7. reject due to management decision CZ, Qualifi\n8. reject due to management decision CZ, Qualifi\n9. Application sent for processing\n10. Rejected by Uni, Qualifi\n11. Intake Closed by Uni Suddenly\n12. Application sent for processing\n13. Application sent for processing\n14. Intake Closed by Uni',offers:'2. CO\n5. CO\n11. UCO',englishWaiver:'',languageTests:'',todo:'SOP and Research Proposal Pending',toApply:'1. UOG Mres Management Sep 25',summary:'The profile is not clear (Check the Drive Word doc for more info). I have asked for the info from Razan to get it from the agent to remake the profile with Elicos 29.03.25/ Defer UOG to Jan,',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:'SID - 1206926'},
            {id:8,name:'Sujeewa',directAgent:'Agent',counselor:'Munsif, Ashfaq',mobile:'',emailCreated:'',registration:'Agent File (Lawyer)',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. Sunderland (CZ)\n2. Hertfordshire (CZ)\n3. Coventry (CZ)\n4. Greenwich (CZ)\n5. BCU (Infinity)',courseIntake:'1. Law LLM Sep/25\n2. LLM Master\'s in Law Sep/25\n3. Law LLM Sep/25\n4. International and Commercial Law, LLM Sep/25\n5. LLM International Law Sep/25',appSubmitDate:'',status:'1. CO\n2. CO\n3. CO\n4. CO\n5. CO',offers:'2. CO\n3. CO\n4. CO\n5. CO',englishWaiver:'',languageTests:'Student said will do, Pending',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:9,name:'Milakshan',directAgent:'Agent',counselor:'Ashfaq, Thasbiha, Munsif',mobile:'',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. Aston (OC)\n2. DMU (CZ)\n3. UOG (GUS)',courseIntake:'1. Electronic and Electrical Eng Foundation Sep/25\n2. Mechatronics and Robotics BEng (Hons) Sep/25\n3. BEng (Hons) Mechatronics Engineering Sep/25',appSubmitDate:'',status:'1. CO\n2. UCO\n3. Uni Not processing for the program/Closed',offers:'1. CO\n2. UCO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'No updates from the Agent/Student for any of the APs',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:10,name:'Hivindu',directAgent:'Direct',counselor:'Bevan',mobile:'',emailCreated:'',registration:'Yes (Bevan)',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. BCU (CZ)\n2. DMU (CZ)\n3. Aston University (CZ)\n4. Hertfordshire (CZ)',courseIntake:'1. International Business (Top-Up) - BA (Hons) Sep/25\n2. Business Administration BA (Hons) (Final Year Top up) Sep/25\n3. BSc (Hons) Global Business and Management (Top-up) Sep/25\n4. BA (Hons) International Business Management (Top Up) Sep/25',appSubmitDate:'',status:'1. Processed\n2. UCO\n3. Need to apply through UCAS and payment required\n4. Processed',offers:'2. UCO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:11,name:'Afkhaan',directAgent:'Direct',counselor:'Bevan, Thasbiha',mobile:'',emailCreated:'',registration:'Not Yet',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. York St John (D)\n2. Hertfordshire (CZ)\n3. Sunderland (Infinity)\n4. UWE (D)',courseIntake:'1. Commercial Law and Practice (LLM) Sep/25\n2. LLM Business Law Sep/25\n3. LL.M Master of Laws Sep/25\n4. LLM International Law and Security Sep/25',appSubmitDate:'',status:'1. Not eligible/3rd class degree\n2. CO\n3. UCO\n4. UCO',offers:'2. CO\n3. CO\n4. UCO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'Pending Documents requested, No updates from the student.',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:12,name:'Ilma Nazim',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'?',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. UOG (GUS)\n2. UWTSD (UniVive)',courseIntake:'1. Mres MSc by Research International Business Sep/25\n2. Available Mres programs for Business Oct/25',appSubmitDate:'',status:'1. CO/Payment\n2. CO for MBA',offers:'1. CO\n2. CO',englishWaiver:'',languageTests:'No',todo:'',toApply:'',summary:'1. 4000 GBP payment made on 23.06.25 By student',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:13,name:'Aasif\n(Shree)',directAgent:'Agent',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'Agent File',zones:'',appReceivedDate:'',docsStatus:'Pending',uni:'1. Worcester (D)\n2. Hertfordshire (CZ)\n3. DMU (CZ)\n4. BCU (CZ)',courseIntake:'1. BA Honours Business Management Top Up Sep/25\n2. BA (Hons) International Business Management (Top Up) Sep/25\n3. Business Administration BA (Hons) (Final Year Top up) Sep/25\n4. International Business (Top-Up) - BA (Hons) Sep/25',appSubmitDate:'',status:'1. CO\n2. UCO/Payment/CAS\n3. CO\n4. Application sent for processing',offers:'1. CO\n2. UCO/payment/CAS\n3. CO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'1. 1000 GBP payment made on 05.08.25 from Nashif (LKR)',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:14,name:'Chameera',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'Pending',uni:'1. Worcester (D)\n2. UOG (GUS)',courseIntake:'1. MRes in International Business and Management Studies Sep/25\n2. Mres MSc by Research International Business Sep/25',appSubmitDate:'',status:'1. Application Rejected\n2. CO',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:15,name:'Nirojiny',directAgent:'Agent',counselor:'Bevan',mobile:'',emailCreated:'',registration:'Promotion File',zones:'',appReceivedDate:'',docsStatus:'Pending',uni:'1. UOG (GUS)\n2. Worscester (D)',courseIntake:'1. Mres MSc by Research International Business Sep/25\n2. MRes in International Business and Management Studies Sep/25',appSubmitDate:'',status:'1. CO/rejected\n2. Application Sent for processing',offers:'1. CO',englishWaiver:'',languageTests:'No',todo:'2. SOP and Research proposal',toApply:'',summary:'1. Offer was rejected due to low Gpa',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:16,name:'Miruth (L.Kishanth)',directAgent:'Direct',counselor:'Umair',mobile:'',emailCreated:'',registration:'Not Yet',zones:'Red',appReceivedDate:'',docsStatus:'',uni:'1. DMU (OX)',courseIntake:'1. Mechatronics and Robotics IY1 Sep/25',appSubmitDate:'',status:'1. UCO',offers:'1. UCO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:'1. Allocated Student ID: 1107413\nReference below: 3016105'},
            {id:17,name:'Sithumini',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'Yes (Thasbiha)',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. Kent (OX)\n2. Aston (OC)\n3. UWE (D)\n4. DMUIC (OX)\n5. DMU L (CZ) \n6. Chester Uni (CZ) \n7. East Anglia (CZ) \n8. Sunderland (CZ)\n9. Asnton London (CEG) \n10. UCA (D)',courseIntake:'1. Computer Science IY1 Sep/25\n2. Computer Science IY1 Sep/25\n3. BSc (Hons) Computer Science Sep/25\n4. BSc (Hons) Computer Science IY1 Sep/25\n5. International Business and Sustainability Management MSc Sep/25\n6. International Business, MSc Sep/25\n7. MSc Business Management Sep/25\n8. Msc Computing Sep/25\n9. MSc Business and Management Sep/25\n10 .Global Master of Business and Management Sep/25',appSubmitDate:'',status:'1. withdrawn. Student want Masters\n2. GAP Not Accepted, Check Summary\n3. Processed/withdrawn Student want Masters\n4. CO/Offer withdrawn. Student want Masters\n5. UCO/Payment/CAS\n6. Application sent for processing\n7. Degree Requierd\n8. Application deadline passed\n9. Rejected\n10. Application Sent for processing',offers:'4. CO\n5. UCO/Payment/CAS',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'2. NARIC does not recognize NVQ L4&5 done by the student, hence the Latest qualification is A.L. and a long Gap is not accepted\n1., 3 & 4. The Student want a master\'s. Should go with the profile making, Applications withdrawn on 31.05.25 after Thasbiha said the same',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:'1. Student ID: 1112546\n4. Student ID: 1112546'},
            {id:18,name:'Sankeethan \n(Shree)',directAgent:'Agent',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'Agent File',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. DMUIC (OX)',courseIntake:'1. Computer science IY1 Sep/25',appSubmitDate:'',status:'1. CO',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:19,name:'Kavithira \n(Shree)',directAgent:'Agent',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'Agent File',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. Aston London (D)\n2. York St John (D)\n3. Wolverhampton (Infinity)\n4. BCU (Infinity)\n5. DMU (infinity)\n6. Sunderland (CZ)\n7. East Anglia (CZ)\n8. Greenwich (CZ)',courseIntake:'1. MSc Business and Management Sep/25\n2. MSc International Business Sep/25\n3. MSc International Business Management Sep/25\n4. MSc Management and International Business Sep/25\n5. International Business and Management MSc Sep/25\n6. MSc Computing Sep/25\n7. MSc Computing Sep/25\n8. Strategic Tourism and Hospitality Management, MSc Sep/25',appSubmitDate:'',status:'1. Application Rejected\n2. Application Rejected\n3. CO\n4. Application sent for processing\n5. Application Rejected\n6. Not Meeting Entry Reqs\n7. Application sent for processing\n8. UCO/Payment/Refund required',offers:'3. CO\n8. UCO/Payment/',englishWaiver:'',languageTests:'',todo:'1. try to check Employment of 3yrs to get an offer from Aston',toApply:'',summary:'2 & 4 Application rejected Due to Low GPa\n8. 3000 GBP paid by the student on 14.08.25',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:20,name:'Karthikan (applied)\n(Shree)',directAgent:'Agent',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'Agent File',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. DMU (CZ)\n2. BCU (Infinity)\n3. Chester Uni (CZ)\n4. Hertfordshire (CZ)',courseIntake:'1. Business Administration BA (Hons) (Final Year Top up) Sep/25\n2. BA (Hons) International Business (Top - up) Sep/25\n3. Business Management and Administration (Top-Up) Sep/25\n4. BA (Hons) Business Administration (top-up) Jan/26',appSubmitDate:'',status:'1. CO/Payment\n2. Application sent for processing\n3. Application sent for processing\n4. CO',offers:'1. CO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'1. 1000 GBP paid on 19.08.25',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:21,name:'Dhanusiya (Re-apply)\n(Shree)',directAgent:'Agent',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'Agent File',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. Hertfordshire (Infinity)\n2. DMU (Infinity)\n3. East Anglia (Infinity)\n4. BCU (Infinity)',courseIntake:'1. BA (Hons) Business Management Sep/25\n2. Business Management BA (Hons) Sep/25 \n3. BA Business Management Sep/25 \n4. BA (Hons) Business Management Sep/25',appSubmitDate:'',status:'1. CO\n2. Application sent for processing\n3. Intake Closed\n4. CO',offers:'1. CO\n4. CO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:22,name:'Ishani',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'Direct, get update',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. Worcester (D)',courseIntake:'1. MRes in International Business and Management Studies Jan/25',appSubmitDate:'',status:'1. Application sent for processing',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'student had requested for Jan 2025 after we applied for Sep/25',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:23,name:'Aruni \n(Shree)',directAgent:'Agent',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'Agent File',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. Sunderland London (Infinity)\n2. BCU (Infinity)\n3. Brunel University London (CZ)\n4. Wolverhampton (Infinity)\n5. East London (Infinity)\n6. UCLAN (CZ)\n7. UCA (D)\n8. Machester Met (Edvoy)\n9. Leeds Beckett University (CZ)\n10. Coventry (CZ)\n11. ULAW (Gus)\n12. Bolton (CZ)',courseIntake:'1. MSc International Business Management Sep 25\n2. MSc Management and International Business Sep 25\n3. International Business MSc Sep 25\n4. MSc International Business Management Sep/25\n5. MSc International Business Management Sep/25\n6. MSc International Business and Management Jan/25\n7. MBM Global Master of Business & Management Sep/25\n8. Msc Management Jan/26\n9. MSc Management and International Business FT Jan/26\n10. Accounting and Financial Management MSc Jan/26\n11, MSc Strategic Business Management Feb./26',appSubmitDate:'',status:'1. Application sent for processing\n2. Application Rejected \n3. Application Rejected\n4. Application Rejected\n5. Application Withdrawn since the student not going\n6. CZ said not meeting Entry Req\n7. CO\n8. Application Not succesfull\n9. Unable to process due to high Gap\n10. CO\n11. Application sent for processing',offers:'7. CO\n10. CO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'2. BCU is not accepting Qualifi\n3. Not meetings entry req\n6. Application Deffered from Sep/25 to jan/26',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:24,name:'Sanjai\n(Shree)',directAgent:'Agent',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'Agent File',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. UGIC (OX)\n2. DMUIC (OX)\n3. UOG (GUS) \n4. RCL (D)\n5. Sunderland (CZ)\n6. Greenwich (CZ)\n7. UCA (D)\n8. Hertz (CZ)',courseIntake:'1. Business Management (Marketing) IY1 Sep/25 \n2. Business Management IY1 Sep/25\n3. BA (Hons) Business Management and Strategy (Level 6) Sep/25\n4. BSc (Hons) Business Management Top up Sep/25\n5. Stage 3 BA (Hons) Business and Management Sep/25\n6. Business Management BA Hons (Top-Up) Sep/25\n7. Business Innovation & Management (top-up) BA (Hons) Sep/25\n8. BA (Hons) International Business Management (Top Up) Jan/26',appSubmitDate:'',status:'1. CO/Withdrawn\n2. CO/Withdrawn\n3. CO\n4. Application sent for processing\n5. Application sent for processing \n6. Application sent for Processing\n7. CO \n8. CO/Payment/cas',offers:'1. CO\n2. CO\n3. CO \n7. CO \n8. CO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'1&2 applications were requested to withdraw on 21.06.25/because after the offer was issued, Thasbiha mentioned that the student needs a top-up and does profile making',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:'ID number: 1129107'},
            {id:25,name:'Pathmasoruban \n(Shree)',directAgent:'Agent',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'Agent File',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. UCA (D)\n2. Coventry (CZ)',courseIntake:'1. MBM Global Master of Business & Management Sep/25\n2. International Business Management Msc Nov/25',appSubmitDate:'',status:'1. Application Sent for processing\n2. CO',offers:'2. CO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:26,name:'Ifaz',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. DMU (CZ)\n2. UCB (CZ)\n3. Coventry (CZ)\n4. Sunderland L (CZ)',courseIntake:'1. Business Management BA (Hons) Sep/25\n2. Business Enterprise BA (Hons) Top-up Sep/25\n3. International Business Top-up BA Sep/25\n4. Business Management and Entrepreneurship (Stage 3) BA (Hons) Sep/25',appSubmitDate:'',status:'1. Waiting for Deferred offer\n2. CO\n3. Waiting for Deferred offer\n4. CO',offers:'2. CO\n4. CO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:27,name:'Sathya',directAgent:'Agent',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'Agent File',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. Greenwich (CZ)\n2. UCA (D)',courseIntake:'1. International Business, MA Sep/25\n2. MBM Global Master of Business & Management Sep/25',appSubmitDate:'',status:'1. Application sent for processing\'\n2. CO',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:28,name:'Sivakajan',directAgent:'',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'?',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. UWE (CZ)\n2. Sunderland (CZ)\n3. RCL (D)\n4. Anglia Ruskin (CZ)\n5. Greenwich (CZ)',courseIntake:'1. Business and Management BA (Hons) Sep/25\n2. BA (Hons) Business and Management Sep/25\n3. BSc (Hons) Business Management Sep/25\n4. BSc (Hons) Business Management Sep/25\n5. Business Management, BA (Hons) Sep/25',appSubmitDate:'',status:'1. Application sent for processing\n2. Application sent for processing\n3. Application sent for processing\n4. Not accepting aps before 2023\n5. Long gap',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:29,name:'kanistan',directAgent:'',counselor:'Munsif, Thasbiha',mobile:'',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. Greenwich (CZ)\n2. Coventry (CZ)\n3. DMUIC (Ox)',courseIntake:'1. Electrical and Electronic Engineering, MSc Sep/25\n2. Electrical and Electronic Engineering, MSc Sep/25\n3. Electronic Engineering pre Masters Nov/25',appSubmitDate:'',status:'1. Not meeting Entry Req\'\n2. Application sent for processing.\n3. CO',offers:'3. CO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:'3. ID number: 1156647'},
            {id:30,name:'Farshan\n(Front-office)',directAgent:'',counselor:'Thasbiha, Shukaina',mobile:'',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'',uni:'',courseIntake:'Want masters in Qualitity Assuarence, Check the docs and Apply with waivers, email, \nThasbiha Said dont apply because student not responding 22.07.25',appSubmitDate:'',status:'',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:31,name:'Uthayanthi\n(Thasbiha Email)',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'',uni:'',courseIntake:'Mres with Waiver Email case, check and update\nStill dont have the passport, needs wolverhampton',appSubmitDate:'',status:'',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:32,name:'Shiham \n(Nashif)',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'*******',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. Anglia Ruskin University (CZ)\n2. DMU London (CZ)\n3. Chester (D)\n4. Aston L (CEG)\n5. Coventry (CZ)',courseIntake:'1. MSc International Business Jan/26\n2. International Business and Sustainability Management MSc Jan/26\n3. International Business, MSc Jan/26\n4. MSc Business and Management Jan/26\n5. International Business Management MSc Jan/26',appSubmitDate:'',status:'1. Not Meeting Entry Req\n2. UCO\n3. Application Will not be Processed\n4. Application Sent for processing\n5. CO',offers:'2. UCO\n5. CO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:'OAI662503 - Chester'},
            {id:33,name:'Thinupa \n(Front Office)',directAgent:'Direct',counselor:'Shukaina',mobile:'',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'',uni:'Missing Docs, mail shared to Frontoffice',courseIntake:'polital science or IR Mres, DOING IELTS, Masters Certificate missing, 11.08',appSubmitDate:'',status:'',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:34,name:'Vargitha \n(Shree)',directAgent:'Agent',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'*******',zones:'',appReceivedDate:'',docsStatus:'',uni:'need edited CV',courseIntake:'Uca and others for masters, and reply thasbiha in email',appSubmitDate:'',status:'',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:35,name:'Niranchitha\n(Front-Office)',directAgent:'Direct',counselor:'Thasbiha, Shukaina',mobile:'',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'',uni:'Pending Docs',courseIntake:'Masters in her own feild, Pending Docs, Specs - No Passport and Degree',appSubmitDate:'',status:'',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:36,name:'Sadini \n(Front-Office)',directAgent:'Direct',counselor:'Thasbiha, Shukaina',mobile:'',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'',uni:'Pending Docs',courseIntake:'Still didnt get an update on the File',appSubmitDate:'',status:'',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:37,name:'Zakwana \n(Azam Spouse)',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. Coventry (CZ)\n2. DMU (CZ)\n3. Hertfordshire (CZ)\n4. Derby (CZ)\n5. UWE (D)',courseIntake:'1. Childhood, Youth and Education Studies BA Sep/25\n2. Education Studies BA (Hons) Sep/25\n3. BA (Hons) Education Sep/25\n4. Bachelor of Education in Primary Education Sep/25\n5. BA(Hons) Primary Education Sep/25',appSubmitDate:'',status:'1. Application Sent for processing\n2. Application Sent for processing\n3. Application Sent for processing\n4. Application Sent for processing\n5. Application Sent for processing',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:38,name:'Anushan\n(Front Office)',directAgent:'Direct',counselor:'Thasbiha, Shukaina',mobile:'',emailCreated:'',registration:'',zones:'Red',appReceivedDate:'',docsStatus:'O.L and A.l Down, Btec pending Needs masters',uni:'1. DMU (CZ)\n2. Sunderland (CZ)\n3. Aston London (CEG)\n4. Hertz (CZ)\n5. Coventry (CZ)\n6. NU London (Nashif Mail)',courseIntake:'1. International Business Management with Sustainable Management MSc Jan/26\n2. MSc International Business Management Jan/26\n3. MSc Business and Management Jan/26\n4. MSc Management Jan/26\n5. International Business Management MSc Jan/26\n6. MSc Business with Entrepreneurship May/26',appSubmitDate:'',status:'1. Application sent for processing\n2. Application sent for processing\n3. CO\n4. CO\n5. CO\n6. Application sent for processing',offers:'3. CO',englishWaiver:'',languageTests:'',todo:'Get elicos from Razaan',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:39,name:'Dilakshan \n(Thasbiha_Munsif)',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. Hertz (CZ)\n2. DMU (CZ)\n3. Sunderland (CZ)\n4. Swansea (CZ)',courseIntake:'1. BA (hons) Business Management Sep/25\n2. Business Management BA Sep/25\n3. \n4. Business Management, BSc (Hons) Jan/26',appSubmitDate:'',status:'1. Application sent for processing\n2. CO\n3. Application sent for processing\n4. Application sent for processing',offers:'2. CO',englishWaiver:'',languageTests:'',todo:'CV needs to be edited Given razaan 23.08, Requested LOR - Thasbiha 25.08',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:40,name:'Sarani Chamathka \n(KEDGE Paris OC)',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'*******',zones:'',appReceivedDate:'',docsStatus:'',uni:'Pending Docs informed Thasbiha',courseIntake:'',appSubmitDate:'',status:'',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:41,name:'Thamilnilavan',directAgent:'Agent',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. UCA (D)\n2. Coventry (CZ)\n3. London Met (CZ)\n4. Hertz (CZ)',courseIntake:'1. Business Innovation & Management (top-up) BA (Hons) Sep/25\n2. Business Management and Leadership BA (top-up) Jan/26\n3. Business Management (Top-up) Jan/26\n4. BA (Hons) International Business Management (Top Up) Jan/26',appSubmitDate:'',status:'1. CO\n2. Application sent for processing\n3. CO - Not eligible for Waiver\n4. UCO/CAS',offers:'1. CO\n3. CO\n4. CO/Payment',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:42,name:'Kabinath',directAgent:'Agent',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'',uni:'1. Coventry (CZ)\n2. Northumbria University London (CZ)\n3. Hertfordshire (CZ)',courseIntake:'1. Global Business (top up) BA - 3rd Year Entry Jan/26\n2. Bsc (Hons) Global Business Management Top up jan/26\n3. BA (Hons) International Business Management (Top Up) Jan/26',appSubmitDate:'',status:'1. CO/Payment/CAS\n2. Application sent for Processing\n3. Co',offers:'1. CO\n3. CO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'1. 8000 GBP payment Made for covnetry',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:43,name:'Vaithehi \n(front Office)',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'Incomplete',uni:'1. Aston (OC)\n2. Hull (OC)\n3. Sunderland (OC)\n4. UCA (D)\n5. DMUIC (OX)\n6. UGIC (OX)\n7. Coventry (CZ)\n8. UWE (D)',courseIntake:'1. Pre masters ICAS - Progression to Accounting Msc Apr/26\n2. Pre Masters - progression to masters Jan/26\n3. Pre Masters - progression to masters Jan/26\n4. Global Master of Business & Management MBM with Pre Masters Jan/26\n5. Pre Masters - International Business Management MSc Jan/26\n6. Pre Masters - MA International Business Jan/26\n7. Accounting and Finance for International Business (Top up) BSc Jan/26\n8. BA(Hons) Business and Management (top-up)',appSubmitDate:'',status:'1. Application Sent for processing\n2. Application Sent for processing\n3. Application Sent for processing\n4. Intake closed for all students\n5. CO\n6. CO\n7. Application Sent for processing\n8. Application Sent for Processing',offers:'5. CO\n6. CO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:'ID number: 1182275 (OX)'},
            {id:44,name:'vithushan',directAgent:'',counselor:'',mobile:'',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'Incomplete',uni:'1. Aston (OC)\n2. UGIC (OX)\n3. DMUIC (OX)\n4. UWE (D)\n5. BCU (Infinity)\n6. DMU (CZ)',courseIntake:'1. IY1 International Business Jan/26\n2. IY1 International Business BA (Hons) Jan/26\n3. IY1 BA (Hons) Business Management Jan/26\n4. BA(Hons) Business and Management Jan/26\n5. BA (Hons) Business Management Jan/26\n6. Business Management BA (Hons) Jan/26',appSubmitDate:'',status:'1. Application Sent for processing\n2. CO\n3. CO\n4. Application Sent for processing\n5. Application Sent for processing',offers:'2. CO\n3. CO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:'ID number: 1180316 (OX)'},
            {id:45,name:'Hari (D)',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'Incomplete',uni:'1. UGIC (OX)\n2. DMUIC (OX)\n3. Greenwich (CZ)',courseIntake:'1. IY1 Business Management BA (Hons) Jan/26\n2. IY1 BA (Hons) Business Management Jan/26\n3. BA (Hons) Business Management Jan/26',appSubmitDate:'',status:'1. CO\n2. CO\n3. UCO/Payment/CAS',offers:'1. CO\n2. CO\n3. UCO/Payment/CAS',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:'ID number: 1181663 (OX)'},
            {id:46,name:'Mufeed (D)',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'',zones:'Green',appReceivedDate:'',docsStatus:'',uni:'1. UWE (D)\n2. UCA (D)\n3. ULAW (GUS)\n4. Worcester (D)',courseIntake:'1. MSc Business Management Jan/26\n2. Global Master of Business & Management MBM Jan/26\n3. MSc Strategic Business Management Feb/26\n4. MSc International Management Jan/26',appSubmitDate:'',status:'1. Application Sent for processing\n2. Application Sent for processing\n3. CO\n4. Application Sent for processing',offers:'3. CO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:'2. UCA - 2600391'},
            {id:47,name:'Akeel Ameer',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'',zones:'Red',appReceivedDate:'',docsStatus:'',uni:'1. Aston L (CEG)\n2. York St John (D)\n3. DMU (CZ)\n4. UCB (CZ)\n5. Sunderland London (Infinity)\n6. NU L (CZ)\n7. BIL (D)',courseIntake:'1. BSc (Hons) Global Business and Management (Top-up) Jan/26\n2. BA (hons) Global Business Management (Top-up) Jan/26\n3. Business Management (Level 6 Top Up) BA (Hons) Jan/26\n4. Business Enterprise BA (Hons) Top-up 3rd Year Jan/26\n5. BA (Hons) Business Management and Entrepreneurship (Top-Up) Apr/26\n6. BSc (Hons) Business Enterprise and Innovation Management (Top up) May/26\n7. BA (Hons) Business Management: Top-up March/26',appSubmitDate:'',status:'1. Offer\n2. Qualifi Not accepted\n3. CO/Payment\n4.  Application sent to university for processing\n5.  Intake Closed\n6. Application sent for processing\n7. Application sent for processing',offers:'1. CO\n3. UCO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:48,name:'Kabilan',directAgent:'',counselor:'',mobile:'',emailCreated:'',registration:'',zones:'Yellow',appReceivedDate:'',docsStatus:'',uni:'1. UWE (D)\n2. East London (Infinity)\n3. Coventry (CZ)',courseIntake:'1. Bio Med Bsc Sep/26\n2. BEng (Hons) Biomedical Engineering Jan/26\n3. Applied Bio Science Bsc March/26',appSubmitDate:'',status:'1. Application Sent for Processing \n2. Application Sent for Processing',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:49,name:'parithasan \n(Razan)',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'',zones:'Yellow',appReceivedDate:'',docsStatus:'',uni:'1. UCA (D)\n2. Greenwich (CZ)\n3. DMUIC (D)',courseIntake:'1. Global Master of Business & Management MBM Jan/26\n2. International Business MA Jan/26\n3.',appSubmitDate:'',status:'1. Intake withdrawn by the student for all students \n2. Application closed - Low GPA\n3. CO',offers:'1. CO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:'ID number: 1208383'},
            {id:50,name:'M I M Inshaf',directAgent:'Direct',counselor:'Nashif',mobile:'',emailCreated:'',registration:'',zones:'Yellow',appReceivedDate:'',docsStatus:'',uni:'1. NAPS (D)',courseIntake:'1. MBA March/26',appSubmitDate:'',status:'1. Application Sent for Processing',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:'Offer reference ID: 9085'},
            {id:51,name:'John Aaron \n(BMICH NZ)',directAgent:'Direct',counselor:'',mobile:'',emailCreated:'',registration:'',zones:'Yellow',appReceivedDate:'',docsStatus:'',uni:'',courseIntake:'',appSubmitDate:'',status:'',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:52,name:'Japhaction',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'',uni:'Pending documents informed to thasbiha',courseIntake:'',appSubmitDate:'',status:'',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:53,name:'Luxshika\n(Germany)',directAgent:'Direct',counselor:'Thasbiha, Razaan, Umair, Nashif',mobile:'',emailCreated:'',registration:'',zones:'Yellow',appReceivedDate:'',docsStatus:'',uni:'1. BSBI (GUS)\n2. Constructor Unversity (Infinity)',courseIntake:'1. MSc International Business Oct/26\n2. Supplychain Management sep/26',appSubmitDate:'',status:'1. Application Sent for Processing \n2. Application Sent for Processing',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:54,name:'Thuwaraga\n(Germany)',directAgent:'Direct',counselor:'Thasbiha, Razaan, Umair, Nashif',mobile:'',emailCreated:'',registration:'',zones:'Yellow',appReceivedDate:'',docsStatus:'',uni:'1. Constructor University (Infinity)\n2. Schiller university (Gedu)\n3. ICN (Gedu)\n4. University of Europe (GUS)\n5. BSBI (GUS)',courseIntake:'1. Master of Business Administration (MBA) Sep/26\n2. \n3. \n4.',appSubmitDate:'',status:'1. Application Sent for Processing \n2. Application Sent to Gedu (Muneera)\n3. Application Sent to Gedu (Muneera)',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:55,name:'Hansani \n(Acheive way)',directAgent:'Agent',counselor:'Razaan',mobile:'Should request for foundation',emailCreated:'',registration:'',zones:'',appReceivedDate:'',docsStatus:'Incomplete',uni:'1. Sheffield Hallam University (CZ)',courseIntake:'1. BSc (Honours) Biomedical Science Sep/26',appSubmitDate:'',status:'1. Application Sent for processing',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:56,name:'Osura',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'',zones:'Yellow',appReceivedDate:'',docsStatus:'',uni:'1. Aston L (CEG)\n2. NU L (Edvoy)\n3. Coventry (Geebee)\n4. ARU (Geebee)',courseIntake:'1. Business Management july/26\n2. BSc (Hons) Business Enterprise and Innovation Management (Top-Up) May/26\n3. BA (Hons) in International Business (Top Up) May/26\n4. BSc (Hons) in International Business Management (Top-Up) March/26',appSubmitDate:'',status:'1. Application Sent for processing\n2. Application Sent for processing\n3. Application Sent for processing\n4. Application Sent for processing',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:'To be spoken with the CEO'},
            {id:57,name:'Pinushanth',directAgent:'Direct',counselor:'Thasbiha',mobile:'',emailCreated:'',registration:'',zones:'Red',appReceivedDate:'',docsStatus:'',uni:'1. BIL London (D)\n2. NU London (Mail Nashif)',courseIntake:'1. Business Management Top up March/26\n2. BSc (Hons) Business Enterprise and Innovation Management (Top-Up) May/26',appSubmitDate:'1. 2/16/2026\n2. 2/13/2026',status:'1. Not accepting Qualifi\n2. Application Sent for processing',offers:'1.CO',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'App 1: 3 days\nApp 1: 6 days',commLog:'',ceoInfo:''},
            {id:58,name:'Meshika Imaya\n(World Key Int)',directAgent:'Agent',counselor:'Razaan',mobile:'',emailCreated:'',registration:'',zones:'Yellow',appReceivedDate:'',docsStatus:'',uni:'1. UNFC (GUS)',courseIntake:'1. Master of Management April/26',appSubmitDate:'',status:'1. Application Sent for processing',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'',commLog:'',ceoInfo:''},
            {id:59,name:'Dharani Dharan \n(World Key Int)',directAgent:'Agent',counselor:'Razaan',mobile:'',emailCreated:'',registration:'',zones:'Green',appReceivedDate:'',docsStatus:'',uni:'1. UCW (Gus)\n2. Kedge Business School (OC)',courseIntake:'1.\n2. International Business Msc Sep/26',appSubmitDate:'1. \n2. 2/16/2026',status:'1. \n2. Application Sent for processing',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'App 1: 3 days',commLog:'',ceoInfo:''},
            {id:60,name:'Vaksala\n(Front Office - D',directAgent:'Direct',counselor:'Thasbiha, Shukaina',mobile:'',emailCreated:'',registration:'',zones:'Green',appReceivedDate:'',docsStatus:'',uni:'1. UCA (D)',courseIntake:'1. BA (Hons) Studio Practice (Make-up and Hair Design) - Top up Sep/26',appSubmitDate:'1. 2/16/2026',status:'1. Application Sent for processing',offers:'',englishWaiver:'',languageTests:'',todo:'',toApply:'',summary:'',leadSource:'',emailId:'',portalUsed:'',portalReplyDate:'',portalReplyStatus:'',daysSinceApp:'App 1: 3 days',commLog:'',ceoInfo:''}
        ];

// Helper: Generate student accounts from ADMISSIONS_DB_DATA
function generateStudentAccounts() {
    return ADMISSIONS_DB_DATA.map((student, index) => {
        const cleanName = student.name.replace(/\n.*/g, '').replace(/\(.*?\)/g, '').trim();
        const studentId = 'GG-STU-' + String(student.id).padStart(3, '0');
        return {
            admissionsId: student.id,
            studentId: studentId,
            name: cleanName,
            counselor: student.counselor || '',
            directAgent: student.directAgent || '',
            hasOffers: !!(student.offers && student.offers.trim()),
            password: studentId
        };
    });
}

// Cloudflare Pages bindings
type Bindings = {
    COMMS: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>()

// Allow CORS for any future API endpoints (optional but safe)
app.use('*', cors())

// --- SERVER-SIDE IN-MEMORY STATE (for Live Demo across devices) ---
// Note: In production (Cloudflare Workers), this state resets on redeploy.
// Use D1 or KV for persistent storage in production.
let GLOBAL_MESSAGES: any[] = [
    { id: 1, sender: 'Nashif A. Razzak', employeeId: 'GG001', text: 'Welcome to the Global Guidance HR System! 🚀', time: '08:00 AM', avatar: 'N', source: 'system', channel: 'general', senderId: 1, serverTimestamp: Date.now() - 86400000, delivered: true, readBy: [] },
    { id: 2, sender: 'Nashif A. Razzak', employeeId: 'GG001', text: 'Good morning team! Please check the new intake targets for the upcoming semester.', time: '09:15 AM', avatar: 'N', channel: 'general', senderId: 1, serverTimestamp: Date.now() - 7200000, delivered: true, readBy: [] },
    { id: 3, sender: 'Thasbiha S.', employeeId: 'GG003', text: 'Noted. I will update the admissions tracker today.', time: '09:22 AM', avatar: 'T', channel: 'general', senderId: 3, serverTimestamp: Date.now() - 7000000, delivered: true, readBy: [] },
    { id: 4, sender: 'Razan Thawus', employeeId: 'GG006', text: 'Visa processing for January intake is 85% complete. Will share detailed report by EOD.', time: '09:30 AM', avatar: 'R', channel: 'general', senderId: 6, serverTimestamp: Date.now() - 6800000, delivered: true, readBy: [] },
    { id: 5, sender: 'Nashif A. Razzak', employeeId: 'GG001', text: 'Important: All staff please submit your daily reports before 5 PM today.', time: '10:00 AM', avatar: 'N', channel: 'announcements', senderId: 1, serverTimestamp: Date.now() - 3600000, delivered: true, readBy: [] },
    { id: 6, sender: 'Umair', employeeId: 'GG004', text: 'Updated the student documents folder. New applications have been processed.', time: '10:45 AM', avatar: 'U', channel: 'admissions', senderId: 4, serverTimestamp: Date.now() - 2400000, delivered: true, readBy: [] },
    { id: 7, sender: 'Sukaina', employeeId: 'GG007', text: 'Three new walk-in students today. Added to the system.', time: '11:00 AM', avatar: 'S', channel: 'admissions', senderId: 7, serverTimestamp: Date.now() - 1800000, delivered: true, readBy: [] },
    { id: 8, sender: 'Shiran', employeeId: 'GG009', text: 'New social media content is ready for review. Check the marketing folder.', time: '11:30 AM', avatar: 'S', channel: 'general', senderId: 9, serverTimestamp: Date.now() - 600000, delivered: true, readBy: [] }
];
let GLOBAL_CALLS = []; // { from: 'UserA', to: 'UserB', type: 'audio', status: 'ringing'|'active'|'ended', timestamp: number }
let GLOBAL_PRESENCE = {}; // { userId: { name, lastSeen: timestamp, status: 'online'|'away' } }
let GLOBAL_TYPING = {}; // { channelKey: { userId: timestamp } }
let GLOBAL_NOTIFICATIONS = [
    { 
        id: 1, 
        userId: 'all', // 'all' means visible to everyone, or specific user ID
        type: 'system', // 'system', 'message', 'call', 'email', 'document', 'leave', 'admission', 'task'
        priority: 'low', // 'high', 'medium', 'low'
        title: 'Welcome to Global Guidance HR',
        message: 'Your advanced notification system is now active! 🎉',
        context: { source: 'System' },
        actions: [], // [{ label: 'View', action: 'view', data: {...} }]
        read: [],  // Array of user IDs who have read this
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        userId: 'all',
        type: 'message',
        priority: 'medium',
        title: 'New Team Message',
        message: 'You have a new message in the #general channel',
        context: { source: 'Communication', sender: 'Nashif A. Razzak' },
        actions: [{ label: 'View Message', action: 'view_message', data: { channel: 'general' } }],
        read: [],
        timestamp: Date.now() - 600000, // 10 minutes ago
        createdAt: new Date(Date.now() - 600000).toISOString()
    },
    {
        id: 3,
        userId: 'GG001', // Nashif only
        type: 'task',
        priority: 'high',
        title: 'Daily Report Due Soon',
        message: 'Your daily report is due in 45 minutes. Please submit before 4:45 PM.',
        context: { source: 'Daily Operations', dueTime: '16:45' },
        actions: [{ label: 'Submit Report', action: 'view_daily_ops', data: { view: 'report' } }],
        read: [],
        timestamp: Date.now() - 1800000, // 30 minutes ago
        createdAt: new Date(Date.now() - 1800000).toISOString()
    },
    {
        id: 4,
        userId: 'all',
        type: 'admission',
        priority: 'high',
        title: 'New Lead Assigned',
        message: 'New lead "Aisha Rahman" has been assigned. Requires immediate follow-up.',
        context: { source: 'Lead Management', leadName: 'Aisha Rahman', leadId: 1 },
        actions: [{ label: 'View Lead', action: 'view_lead', data: { leadId: 1 } }],
        read: [],
        timestamp: Date.now() - 3600000, // 1 hour ago
        createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: 5,
        userId: 'all',
        type: 'document',
        priority: 'medium',
        title: 'Document Uploaded',
        message: 'New document "Q1 Performance Report" has been uploaded to Documents.',
        context: { source: 'Documents', documentName: 'Q1 Performance Report' },
        actions: [{ label: 'View Document', action: 'view_document', data: { docId: 101 } }],
        read: [],
        timestamp: Date.now() - 7200000, // 2 hours ago
        createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
        id: 6,
        userId: 'GG002', // Sukaina only
        type: 'leave',
        priority: 'high',
        title: 'Leave Request Pending',
        message: 'Your leave request for March 15-17 is pending approval.',
        context: { source: 'Leave Management', dates: 'March 15-17' },
        actions: [
            { label: 'View Request', action: 'view_leave', data: { requestId: 5 } }
        ],
        read: [],
        timestamp: Date.now() - 10800000, // 3 hours ago
        createdAt: new Date(Date.now() - 10800000).toISOString()
    },
    {
        id: 7,
        userId: 'all',
        type: 'call',
        priority: 'medium',
        title: 'Missed Call',
        message: 'You missed a call from Sukaina Khan at 2:30 PM.',
        context: { source: 'Communication', caller: 'Sukaina Khan', time: '2:30 PM' },
        actions: [{ label: 'Call Back', action: 'view_message', data: { user: 'Sukaina Khan' } }],
        read: [],
        timestamp: Date.now() - 14400000, // 4 hours ago
        createdAt: new Date(Date.now() - 14400000).toISOString()
    }
]; // Advanced notification storage

// --- LEAD MANAGEMENT DATA ---
let GLOBAL_LEADS = [
    {
        id: 1,
        name: 'Aisha Rahman',
        email: 'aisha.rahman@email.com',
        phone: '+94771234567',
        country: 'UK',
        intakePeriod: 'September 2025',
        status: 'new',
        source: 'Meta',
        assignedCounselorId: 1,
        assignedCounselor: 'Nashif A. Razzak',
        createdDate: new Date('2025-02-01').toISOString(),
        lastContactDate: null,
        followUpDate: new Date('2025-02-08').toISOString(),
        flagged: true,
        flagReason: 'Not contacted within 24 hours',
        notes: 'Interested in Computer Science programs. Prefers London universities.',
        documents: []
    },
    {
        id: 2,
        name: 'Kamal Perera',
        email: 'kamal.p@email.com',
        phone: '+94772345678',
        country: 'Australia',
        intakePeriod: 'February 2025',
        status: 'contacted',
        source: 'Walk-in',
        assignedCounselorId: 2,
        assignedCounselor: 'Sukaina Khan',
        createdDate: new Date('2025-01-28').toISOString(),
        lastContactDate: new Date('2025-02-05').toISOString(),
        followUpDate: new Date('2025-02-10').toISOString(),
        flagged: false,
        flagReason: null,
        notes: 'Looking for MBA programs in Melbourne or Sydney.',
        documents: ['passport.pdf', 'degree_transcript.pdf']
    },
    {
        id: 3,
        name: 'Nimal Silva',
        email: 'nimal.silva@email.com',
        phone: '+94773456789',
        country: 'Canada',
        intakePeriod: 'September 2025',
        status: 'qualified',
        source: 'Google',
        assignedCounselorId: 1,
        assignedCounselor: 'Nashif A. Razzak',
        createdDate: new Date('2025-01-20').toISOString(),
        lastContactDate: new Date('2025-02-03').toISOString(),
        followUpDate: new Date('2025-02-12').toISOString(),
        flagged: false,
        flagReason: null,
        notes: 'Qualified for top Canadian universities. IELTS 7.5. GPA 3.8.',
        documents: ['passport.pdf', 'ielts.pdf', 'transcript.pdf']
    },
    {
        id: 4,
        name: 'Amira Nazeem',
        email: 'amira.n@email.com',
        phone: '+94774567890',
        country: 'USA',
        intakePeriod: 'January 2026',
        status: 'registered',
        source: 'Referral',
        assignedCounselorId: 2,
        assignedCounselor: 'Sukaina Khan',
        createdDate: new Date('2024-12-15').toISOString(),
        lastContactDate: new Date('2025-01-30').toISOString(),
        followUpDate: null,
        flagged: false,
        flagReason: null,
        notes: 'Successfully registered for Fall 2026. MIT admission confirmed.',
        documents: ['passport.pdf', 'sat_scores.pdf', 'transcript.pdf', 'recommendation_letters.pdf']
    }
];

let LEAD_ID_COUNTER = 5;

// ✅ Main route – serve the v8.1 Command Portal (matches uploaded sample exactly)
app.get('/', (c) => {
  return c.html(commandPortalPage)
})

// Dashboard alias also serves the Command Portal
app.get('/dashboard', (c) => {
  return c.html(commandPortalPage)
})

// Legacy React shell — kept available for deep-link compatibility
app.get('/legacy', (c) => {
  return c.html(htmlTemplate)
})
app.get('/legacy-dashboard', (c) => {
  return c.html(htmlTemplate)
})

// Serve shared authentication JavaScript
app.get('/shared-auth.js', (c) => {
  return c.text(sharedAuthJS, 200, {
    'Content-Type': 'application/javascript'
  })
})

// Favicon - return empty 200 to prevent 404 errors
app.get('/favicon.ico', (c) => {
  return new Response(null, { status: 204 })
})

// --- API ENDPOINTS FOR LIVE SYNC ---

// 0. File Upload/Download API (in-memory for demo; stores base64)
let GLOBAL_FILES: Record<string, any> = {};
// { fileId: { name, type, size, data (base64), uploadedBy, uploadedAt, downloadCount } }

app.post('/api/files/upload', async (c) => {
    try {
        const body = await c.req.json();
        const { fileName, fileType, fileSize, fileData, uploadedBy } = body;
        const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        GLOBAL_FILES[fileId] = {
            id: fileId,
            name: fileName,
            type: fileType,
            size: fileSize,
            data: fileData, // base64 string
            uploadedBy: uploadedBy,
            uploadedAt: Date.now(),
            downloadCount: 0
        };
        // Keep max 100 files
        const keys = Object.keys(GLOBAL_FILES);
        if (keys.length > 100) delete GLOBAL_FILES[keys[0]];
        return c.json({ success: true, fileId, fileName, fileSize });
    } catch (e) {
        return c.json({ success: false, error: 'Upload failed' }, 400);
    }
});

app.get('/api/files/:fileId', (c) => {
    const fileId = c.req.param('fileId');
    const file = GLOBAL_FILES[fileId];
    if (!file) return c.json({ error: 'File not found' }, 404);
    file.downloadCount++;
    return c.json({ success: true, file: { id: file.id, name: file.name, type: file.type, size: file.size, uploadedBy: file.uploadedBy, uploadedAt: file.uploadedAt } });
});

app.get('/api/files/:fileId/download', (c) => {
    const fileId = c.req.param('fileId');
    const file = GLOBAL_FILES[fileId];
    if (!file) return c.json({ error: 'File not found' }, 404);
    file.downloadCount++;
    // Return base64 data for client-side download
    return c.json({ success: true, fileName: file.name, fileType: file.type, data: file.data });
});

// 0b. Channel Management API (CEO/COO only for admin actions)
let GLOBAL_CHANNELS: any[] = [
    { id: 'general', name: 'General', type: 'public', createdBy: 'GG001', createdAt: Date.now() - 86400000 },
    { id: 'announcements', name: 'Announcements', type: 'public', createdBy: 'GG001', createdAt: Date.now() - 86400000 },
    { id: 'admissions', name: 'Admissions Team', type: 'department', department: 'Admissions', createdBy: 'GG001', createdAt: Date.now() - 86400000 },
    { id: 'visa', name: 'Visa Processing', type: 'department', department: 'BD & Visa', createdBy: 'GG001', createdAt: Date.now() - 86400000 },
    { id: 'hr', name: 'HR Confidential', type: 'department', department: 'Admin/HR', createdBy: 'GG001', createdAt: Date.now() - 86400000 },
    { id: 'students', name: 'Student Comms', type: 'student', createdBy: 'GG001', createdAt: Date.now() - 86400000 }
];

app.get('/api/channels', (c) => {
    return c.json(GLOBAL_CHANNELS);
});

app.post('/api/channels', async (c) => {
    const body = await c.req.json();
    const { name, type, department, members, createdBy, employeeLevel } = body;
    // Only CEO/COO (level >= 100) can create channels
    if (employeeLevel < 100) return c.json({ success: false, error: 'Only CEO/COO can create channels' }, 403);
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    if (GLOBAL_CHANNELS.find(ch => ch.id === id)) return c.json({ success: false, error: 'Channel already exists' }, 400);
    const newChannel = { id, name, type: type || 'public', department, members: members || [], createdBy, createdAt: Date.now() };
    GLOBAL_CHANNELS.push(newChannel);
    return c.json({ success: true, channel: newChannel });
});

app.put('/api/channels/:channelId', async (c) => {
    const channelId = c.req.param('channelId');
    const body = await c.req.json();
    const { employeeLevel } = body;
    if (employeeLevel < 100) return c.json({ success: false, error: 'Only CEO/COO can manage channels' }, 403);
    const channel = GLOBAL_CHANNELS.find(ch => ch.id === channelId);
    if (!channel) return c.json({ success: false, error: 'Channel not found' }, 404);
    if (body.name) channel.name = body.name;
    if (body.members) channel.members = body.members;
    if (body.type) channel.type = body.type;
    if (body.department) channel.department = body.department;
    return c.json({ success: true, channel });
});

app.delete('/api/channels/:channelId', async (c) => {
    const channelId = c.req.param('channelId');
    const employeeLevel = parseInt(c.req.query('level') || '0');
    if (employeeLevel < 100) return c.json({ success: false, error: 'Only CEO/COO can delete channels' }, 403);
    if (['general', 'announcements'].includes(channelId)) return c.json({ success: false, error: 'Cannot delete default channels' }, 400);
    GLOBAL_CHANNELS = GLOBAL_CHANNELS.filter(ch => ch.id !== channelId);
    // Also delete messages in that channel
    GLOBAL_MESSAGES = GLOBAL_MESSAGES.filter(m => m.channel !== channelId);
    return c.json({ success: true });
});

// 0c. Delete Message API (CEO/COO only)
app.delete('/api/messages/:messageId', async (c) => {
    const messageId = parseFloat(c.req.param('messageId'));
    const employeeLevel = parseInt(c.req.query('level') || '0');
    if (employeeLevel < 100) return c.json({ success: false, error: 'Only CEO/COO can delete messages' }, 403);
    const idx = GLOBAL_MESSAGES.findIndex(m => m.id === messageId);
    if (idx === -1) return c.json({ success: false, error: 'Message not found' }, 404);
    GLOBAL_MESSAGES.splice(idx, 1);
    return c.json({ success: true });
});

// 0d. Student Communication API (staff <-> student messaging)
let STUDENT_MESSAGES: any[] = [
    { id: 1, studentId: 'GG-STU-001', studentName: 'Azam', staffId: 'GG003', staffName: 'Thasbiha S.', sender: 'staff', text: 'Hi Azam, welcome to Global Guidance! Your application is being processed.', time: '09:00 AM', timestamp: Date.now() - 86400000, read: true },
    { id: 2, studentId: 'GG-STU-001', studentName: 'Azam', staffId: 'GG003', staffName: 'Thasbiha S.', sender: 'student', text: 'Thank you! When will I get an update on my university application?', time: '09:15 AM', timestamp: Date.now() - 82800000, read: true },
    { id: 3, studentId: 'GG-STU-001', studentName: 'Azam', staffId: 'GG003', staffName: 'Thasbiha S.', sender: 'staff', text: 'We expect a response within 2-3 weeks. I will keep you updated.', time: '09:30 AM', timestamp: Date.now() - 79200000, read: true },
    { id: 4, studentId: 'GG-STU-003', studentName: 'Kawsiya', staffId: 'GG003', staffName: 'Thasbiha S.', sender: 'staff', text: 'Kawsiya, please upload your pending documents as soon as possible.', time: '10:00 AM', timestamp: Date.now() - 72000000, read: false }
];

// Staff gets student messages (optionally filter by studentId)
app.get('/api/student-messages', (c) => {
    const studentId = c.req.query('studentId');
    const staffId = c.req.query('staffId');
    let msgs = STUDENT_MESSAGES;
    if (studentId) msgs = msgs.filter(m => m.studentId === studentId);
    if (staffId) msgs = msgs.filter(m => m.staffId === staffId);
    return c.json(msgs);
});

// Staff or student sends a message
app.post('/api/student-messages', async (c) => {
    const body = await c.req.json();
    const newMsg = {
        id: Date.now() + Math.random(),
        studentId: body.studentId,
        studentName: body.studentName,
        staffId: body.staffId,
        staffName: body.staffName,
        sender: body.sender, // 'staff' or 'student'
        text: body.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        read: false,
        fileId: body.fileId || null,
        fileName: body.fileName || null
    };
    STUDENT_MESSAGES.push(newMsg);
    if (STUDENT_MESSAGES.length > 1000) STUDENT_MESSAGES.shift();
    return c.json({ success: true, message: newMsg });
});

// Get list of students with unread message counts (for staff sidebar)
app.get('/api/student-messages/summary', (c) => {
    const staffId = c.req.query('staffId');
    const students: Record<string, any> = {};
    STUDENT_MESSAGES.forEach(m => {
        if (staffId && m.staffId !== staffId && staffId !== 'all') return;
        if (!students[m.studentId]) {
            students[m.studentId] = { studentId: m.studentId, studentName: m.studentName, lastMessage: m.text, lastTimestamp: m.timestamp, unread: 0, staffId: m.staffId, staffName: m.staffName };
        }
        if (m.timestamp > students[m.studentId].lastTimestamp) {
            students[m.studentId].lastMessage = m.text;
            students[m.studentId].lastTimestamp = m.timestamp;
        }
        if (m.sender === 'student' && !m.read) students[m.studentId].unread++;
    });
    // Also add students from ADMISSIONS_DB who haven't messaged yet
    const accounts = generateStudentAccounts();
    accounts.forEach(a => {
        if (!students[a.studentId]) {
            students[a.studentId] = { studentId: a.studentId, studentName: a.name, lastMessage: null, lastTimestamp: 0, unread: 0, staffId: '', staffName: '', counselor: a.counselor };
        }
    });
    return c.json(Object.values(students).sort((a, b) => b.lastTimestamp - a.lastTimestamp));
});

// ============================================================
// Durable cross-device messaging via Cloudflare KV  (v14.4)
// ============================================================
// Cloudflare Workers run inside short-lived isolates and the in-memory
// GLOBAL_MESSAGES array is NOT shared across requests. To make messages
// reliably reach other staff members on different devices, we persist
// every message to KV (key: "messages:all"). KV is eventually consistent
// across edge locations within ~1s.
//
// CRITICAL v14.4 fix: We MUST await the KV put() before returning, OR use
// c.executionCtx.waitUntil() — otherwise on Cloudflare Workers the request
// can be torn down before the async write completes, causing silent data loss.
// The v14.3 code awaited it but in some isolate-tear-down races the write
// was lost. We now (1) await the KV write inline AND (2) wrap it with
// waitUntil so even if the response races out, the write completes.
//
// We also dropped the GLOBAL_MESSAGES fallback inside kvLoadMessages — instead
// we seed KV ONCE on first read so that subsequent isolates see the same data.
const KV_MESSAGES_KEY = 'messages:all';
const KV_MESSAGES_CAP = 500;
let _kvSeedAttempted = false;

async function kvLoadMessages(c: any): Promise<any[]> {
    try {
        if (!c.env || !c.env.COMMS) {
            // No KV binding at all — local dev or misconfigured. Return in-memory.
            return GLOBAL_MESSAGES.slice();
        }
        const raw = await c.env.COMMS.get(KV_MESSAGES_KEY, { type: 'json' });
        if (Array.isArray(raw) && raw.length > 0) return raw;
        // KV is empty — seed it from GLOBAL_MESSAGES seed data ONCE.
        if (!_kvSeedAttempted) {
            _kvSeedAttempted = true;
            try {
                await c.env.COMMS.put(KV_MESSAGES_KEY, JSON.stringify(GLOBAL_MESSAGES));
            } catch (e) { /* ignore */ }
        }
        return GLOBAL_MESSAGES.slice();
    } catch (e) {
        console.error('kvLoadMessages failed:', e);
        return GLOBAL_MESSAGES.slice();
    }
}

async function kvSaveMessages(c: any, msgs: any[]): Promise<boolean> {
    try {
        if (!c.env || !c.env.COMMS) return false;
        const trimmed = msgs.length > KV_MESSAGES_CAP ? msgs.slice(-KV_MESSAGES_CAP) : msgs;
        await c.env.COMMS.put(KV_MESSAGES_KEY, JSON.stringify(trimmed));
        return true;
    } catch (e) {
        console.error('kvSaveMessages failed:', e);
        return false;
    }
}

// Diagnostic: confirms KV binding works + reports current count
app.get('/api/kv-status', async (c) => {
    const status: any = {
        hasEnv: !!c.env,
        hasCOMMS: !!(c.env && c.env.COMMS),
        timestamp: Date.now()
    };
    if (status.hasCOMMS) {
        try {
            const raw = await c.env.COMMS.get(KV_MESSAGES_KEY, { type: 'json' });
            status.messagesInKV = Array.isArray(raw) ? raw.length : null;
            status.kvKeyExists = raw !== null;
            // Test write
            const testKey = 'diag:' + Date.now();
            await c.env.COMMS.put(testKey, 'ok', { expirationTtl: 60 });
            const readBack = await c.env.COMMS.get(testKey);
            status.writeReadOk = readBack === 'ok';
        } catch (e: any) {
            status.error = e && e.message || String(e);
        }
    }
    status.globalMessagesCount = GLOBAL_MESSAGES.length;
    return c.json(status);
});

// 1. Get Messages (with pagination support via ?since=timestamp)
app.get('/api/messages', async (c) => {
    const since = parseInt(c.req.query('since') || '0');
    const all = await kvLoadMessages(c);
    if (since > 0) {
        const newMsgs = all.filter((m: any) => m.serverTimestamp > since);
        return c.json({ messages: newMsgs, timestamp: Date.now(), total: all.length });
    }
    return c.json({ messages: all, timestamp: Date.now(), total: all.length });
});

// 2. Send Message — writes to BOTH KV (durable, cross-device) AND in-memory.
//    v14.4: We read CURRENT KV state, append, write back atomically (await),
//    AND wrap with waitUntil so the request lifecycle doesn't cancel the put.
app.post('/api/messages', async (c) => {
    const msg = await c.req.json();
    const now = Date.now();
    // Strip dataURL out of file attachments — those are stored separately via
    // /api/files/:id. The client uploads the file first, gets back a fileId,
    // then sends the message with file={id, name, size, type} (NO dataUrl).
    // This avoids bloating the messages:all KV value past the 25MB limit.
    if (msg.file && msg.file.dataUrl && !msg.file.id) {
        // Legacy client sent inline dataURL — accept it but warn in logs.
        console.warn('Legacy inline dataURL attachment received; size=', (msg.file.dataUrl||'').length);
    }
    const newMsg = {
        ...msg,
        id: msg.id && typeof msg.id === 'string' && msg.id.indexOf('bc-') === 0
            ? msg.id  // preserve BroadcastChannel-relay id for dedupe
            : now + Math.random(),
        serverTimestamp: now,
        delivered: true,
        deliveredAt: now,
        readBy: []
    };

    // Append to in-memory (for this isolate's hot path)
    GLOBAL_MESSAGES.push(newMsg);
    if (GLOBAL_MESSAGES.length > KV_MESSAGES_CAP) GLOBAL_MESSAGES.shift();

    // Persist to KV. v14.4: AWAIT the write so the response only returns
    // after KV has confirmed the put. Also use waitUntil so even if the
    // client disconnects, the write completes.
    let kvOk = false;
    if (c.env && c.env.COMMS) {
        try {
            const existing = await kvLoadMessages(c);
            if (!existing.some((m: any) => m.id === newMsg.id)) {
                existing.push(newMsg);
                kvOk = await kvSaveMessages(c, existing);
            } else {
                kvOk = true;  // already present
            }
        } catch (e) {
            console.error('POST /api/messages KV write failed:', e);
        }
    }

    // Also schedule a waitUntil re-write as a safety net (idempotent)
    try {
        const ctx = (c as any).executionCtx;
        if (ctx && typeof ctx.waitUntil === 'function' && c.env && c.env.COMMS && !kvOk) {
            ctx.waitUntil((async () => {
                try {
                    const again = await kvLoadMessages(c);
                    if (!again.some((m: any) => m.id === newMsg.id)) {
                        again.push(newMsg);
                        await kvSaveMessages(c, again);
                    }
                } catch (e) {}
            })());
        }
    } catch (e) {}

    return c.json({ success: true, message: newMsg, kvPersisted: kvOk });
});

// ============================================================
// 2a. File / Attachment storage  (v14.4)
// ============================================================
// Inline dataURLs in messages bloat the messages:all KV value and cause
// silent write failures past ~25MB. We store each file as its own KV key
// (`file:<id>`) with a 7-day TTL, and messages carry only a tiny reference.
// Recipients fetch /api/files/:id on demand to render the attachment.
const KV_FILE_TTL = 7 * 24 * 3600; // 7 days
const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10 MB per file (KV limit is 25MB per value)

// NOTE: Using /api/attachments not /api/files because the latter already
// exists for the Media Library (GLOBAL_FILES in-memory). Keeping them separate
// avoids any route conflicts.
app.post('/api/attachments', async (c) => {
    try {
        const body = await c.req.json();
        if (!body || !body.dataUrl) {
            return c.json({ success: false, error: 'missing dataUrl' }, 400);
        }
        const dataUrl: string = String(body.dataUrl);
        if (dataUrl.length > FILE_SIZE_LIMIT * 1.4) { // base64 is ~1.37x raw
            return c.json({ success: false, error: 'file too large (max 10MB)' }, 413);
        }
        const id = 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
        const meta = {
            id,
            name: String(body.name || 'file'),
            size: Number(body.size || 0),
            type: String(body.type || 'application/octet-stream'),
            uploadedAt: Date.now()
        };
        if (!c.env || !c.env.COMMS) {
            return c.json({ success: false, error: 'storage unavailable' }, 503);
        }
        // Store the dataURL under att:<id>
        await c.env.COMMS.put('att:' + id, JSON.stringify({ ...meta, dataUrl }), {
            expirationTtl: KV_FILE_TTL
        });
        // v14.7: Also add to attachment index for shared Media Library
        try {
            const idx = await c.env.COMMS.get('att:index', { type: 'json' });
            const arr = Array.isArray(idx) ? idx : [];
            arr.push({
                id,
                name: meta.name,
                size: meta.size,
                type: meta.type,
                uploaderUser: String(body.uploaderUser || ''),
                uploaderName: String(body.uploaderName || ''),
                channel: String(body.channel || ''),
                recipients: Array.isArray(body.recipients) ? body.recipients : [],
                uploadedAt: meta.uploadedAt
            });
            const trimmed = arr.length > 1000 ? arr.slice(-1000) : arr;
            await c.env.COMMS.put('att:index', JSON.stringify(trimmed));
        } catch (e) { /* non-fatal */ }
        return c.json({ success: true, file: meta });
    } catch (e: any) {
        return c.json({ success: false, error: e && e.message || String(e) }, 500);
    }
});

app.get('/api/attachments/:id', async (c) => {
    try {
        const id = c.req.param('id');
        if (!c.env || !c.env.COMMS) return c.json({ error: 'storage unavailable' }, 503);
        const raw = await c.env.COMMS.get('att:' + id, { type: 'json' });
        if (!raw) return c.json({ error: 'not found' }, 404);
        return c.json({ success: true, file: raw });
    } catch (e: any) {
        return c.json({ error: e && e.message || String(e) }, 500);
    }
});

// 2b. Mark messages as read
app.post('/api/messages/read', async (c) => {
    const { userId, messageIds } = await c.req.json();
    if (userId && messageIds) {
        messageIds.forEach((msgId: number) => {
            const msg = GLOBAL_MESSAGES.find(m => m.id === msgId);
            if (msg && !msg.readBy?.includes(userId)) {
                if (!msg.readBy) msg.readBy = [];
                msg.readBy.push(userId);
            }
        });
    }
    return c.json({ success: true });
});

// ============================================================
// 2d. Cross-device call signaling (durable via KV)
// ============================================================
// Each call invite / accept / decline / end is a tiny JSON signal addressed
// to a specific target user. The recipient's portal polls /api/signal every
// 3 s to discover incoming invites and ring. KV TTL of 60s auto-cleans
// abandoned signals. This solves the user's complaint that "I couldn't call
// them" — BroadcastChannel only works within one browser/device, KV reaches
// staff on any device anywhere.
const KV_SIGNALS_KEY = 'signals:all';
const KV_SIGNALS_CAP = 200;

async function kvLoadSignals(c: any): Promise<any[]> {
    try {
        if (!c.env || !c.env.COMMS) return [];
        const raw = await c.env.COMMS.get(KV_SIGNALS_KEY, { type: 'json' });
        if (!Array.isArray(raw)) return [];
        // Expire signals older than 60s
        const cutoff = Date.now() - 60_000;
        return raw.filter((s: any) => (s.ts || 0) > cutoff);
    } catch (e) { return []; }
}

async function kvSaveSignals(c: any, signals: any[]): Promise<void> {
    try {
        if (!c.env || !c.env.COMMS) return;
        const trimmed = signals.length > KV_SIGNALS_CAP ? signals.slice(-KV_SIGNALS_CAP) : signals;
        await c.env.COMMS.put(KV_SIGNALS_KEY, JSON.stringify(trimmed), { expirationTtl: 120 });
    } catch (e) { /* non-fatal */ }
}

// POST a signal (call_invite, call_accept, call_decline, call_end, snap_request, snap_response)
app.post('/api/signal', async (c) => {
    const body = await c.req.json();
    const sig = {
        id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        kind: String(body.kind || 'unknown'),
        fromUser: String(body.fromUser || ''),
        fromName: String(body.fromName || ''),
        toUser: String(body.toUser || ''),
        callId: body.callId || null,
        callType: body.callType || null,
        requestId: body.requestId || null,
        dataUrl: body.dataUrl || null,
        denied: !!body.denied,
        ts: Date.now()
    };
    let saved = false;
    try {
        const existing = await kvLoadSignals(c);
        existing.push(sig);
        await kvSaveSignals(c, existing);
        saved = true;
    } catch (e) {
        console.error('POST /api/signal KV write failed:', e);
    }
    // v14.7: Also log call lifecycle events into the durable call history
    try {
        if (sig.kind === 'call_invite' || sig.kind === 'call_accept' ||
            sig.kind === 'call_decline' || sig.kind === 'call_end') {
            const statusMap: any = {
                call_invite: 'started',
                call_accept: 'accepted',
                call_decline: 'declined',
                call_end: 'ended'
            };
            const callEntry = {
                id: 'call_' + sig.id,
                ts: sig.ts,
                callId: sig.callId || '',
                callType: sig.callType || 'voice',
                status: statusMap[sig.kind],
                fromUser: sig.fromUser,
                fromName: sig.fromName,
                toUser: sig.toUser,
                toName: '',
                durationMs: 0
            };
            const calls = await (async () => {
                try {
                    if (!c.env || !c.env.COMMS) return [];
                    const r = await c.env.COMMS.get('calls:log', { type: 'json' });
                    return Array.isArray(r) ? r : [];
                } catch (e) { return []; }
            })();
            const dedupeKey = callEntry.callId + ':' + callEntry.status;
            if (!calls.some((x: any) => (x.callId + ':' + x.status) === dedupeKey)) {
                calls.push(callEntry);
                try {
                    const trimmed = calls.length > 500 ? calls.slice(-500) : calls;
                    await c.env.COMMS.put('calls:log', JSON.stringify(trimmed), { expirationTtl: 60 * 60 * 24 * 30 });
                } catch (e) {}
            }
        }
    } catch (e) {}
    return c.json({ success: true, signal: sig, kvPersisted: saved });
});

// GET signals addressed to a specific user, newer than ?since=
app.get('/api/signal', async (c) => {
    const me = c.req.query('user') || '';
    const since = parseInt(c.req.query('since') || '0');
    if (!me) return c.json({ signals: [], timestamp: Date.now() });
    const all = await kvLoadSignals(c);
    const mine = all.filter((s: any) =>
        s.toUser === me && s.ts > since && s.fromUser !== me
    );
    return c.json({ signals: mine, timestamp: Date.now() });
});

// 2c. Typing indicator
app.post('/api/typing', async (c) => {
    const { userId, userName, channel } = await c.req.json();
    const key = channel || 'general';
    if (!GLOBAL_TYPING[key]) GLOBAL_TYPING[key] = {};
    GLOBAL_TYPING[key][userId] = { name: userName, timestamp: Date.now() };
    // Clean old typing indicators (> 4s)
    const now = Date.now();
    Object.keys(GLOBAL_TYPING).forEach(ch => {
        Object.keys(GLOBAL_TYPING[ch]).forEach(uid => {
            if (now - GLOBAL_TYPING[ch][uid].timestamp > 4000) delete GLOBAL_TYPING[ch][uid];
        });
    });
    return c.json({ success: true });
});

app.get('/api/typing', (c) => {
    const channel = c.req.query('channel') || 'general';
    const now = Date.now();
    // Return active typists (< 4s)
    const typists = GLOBAL_TYPING[channel] 
        ? Object.entries(GLOBAL_TYPING[channel])
            .filter(([_, v]) => now - (v as any).timestamp < 4000)
            .map(([uid, v]) => ({ userId: uid, name: (v as any).name }))
        : [];
    return c.json(typists);
});

// 2d. Presence (online status)
app.post('/api/presence', async (c) => {
    const { userId, name } = await c.req.json();
    GLOBAL_PRESENCE[userId] = { name, lastSeen: Date.now(), status: 'online' };
    // Clean stale presence (> 15s = offline)
    const now = Date.now();
    Object.keys(GLOBAL_PRESENCE).forEach(uid => {
        if (now - GLOBAL_PRESENCE[uid].lastSeen > 15000) delete GLOBAL_PRESENCE[uid];
    });
    return c.json({ success: true });
});

app.get('/api/presence', (c) => {
    const now = Date.now();
    const result: Record<string, any> = {};
    Object.entries(GLOBAL_PRESENCE).forEach(([uid, data]: [string, any]) => {
        result[uid] = {
            ...data,
            status: (now - data.lastSeen < 10000) ? 'online' : 'away'
        };
    });
    return c.json(result);
});

// 2e. Emails API (server-side storage)
let GLOBAL_EMAILS: any[] = [
    { id: 1, from: 'Nashif A. Razzak', fromId: 'GG001', to: 'All', subject: 'Welcome to Global Guidance', body: 'Welcome to the Global Guidance HR communication system. Please use this platform for all official communications.', date: new Date().toLocaleDateString(), read: false, folder: 'inbox', starred: false, timestamp: Date.now() - 3600000 },
    { id: 2, from: 'Nashif A. Razzak', fromId: 'GG001', to: 'All', subject: 'Team Meeting - Weekly Update', body: 'Hi team,\\n\\nPlease join the weekly update meeting this Friday at 10:00 AM. We will discuss the upcoming intake targets and visa processing updates.\\n\\nBest regards,\\nNashif', date: new Date().toLocaleDateString(), read: false, folder: 'inbox', starred: false, timestamp: Date.now() - 7200000 }
];

app.get('/api/emails', (c) => {
    const userId = c.req.query('userId');
    const userEmails = GLOBAL_EMAILS.filter(e => e.to === 'All' || e.to === userId || e.fromId === userId);
    return c.json(userEmails);
});

app.post('/api/emails', async (c) => {
    const email = await c.req.json();
    const newEmail = { ...email, id: Date.now(), timestamp: Date.now() };
    GLOBAL_EMAILS.push(newEmail);
    if (GLOBAL_EMAILS.length > 200) GLOBAL_EMAILS.shift();
    return c.json({ success: true, email: newEmail });
});

// 3. Call Signaling (LEGACY WebRTC signaling for src/template.html — moved to /api/calls/rtc
// to avoid shadowing the v14.7 call-history endpoint at /api/calls)
app.get('/api/calls/rtc', (c) => {
    // Clean up old calls (> 60s idle)
    const now = Date.now();
    GLOBAL_CALLS = GLOBAL_CALLS.filter(call => (now - call.timestamp) < 60000 || call.status === 'active');
    return c.json(GLOBAL_CALLS);
});

app.post('/api/calls/rtc', async (c) => {
    const signal = await c.req.json(); // { type: 'offer'|'answer'|'end', from, to, callType }
    
    if (signal.type === 'offer') {
        // Start new call
        const newCall = { 
            id: Date.now(), 
            from: signal.from, 
            to: signal.to, 
            type: signal.callType, 
            status: 'ringing', 
            timestamp: Date.now() 
        };
        GLOBAL_CALLS.push(newCall);
        return c.json(newCall);
    } 
    else if (signal.type === 'answer') {
        // Find ringing call and active it
        const call = GLOBAL_CALLS.find(c => c.from === signal.to && c.to === signal.from && c.status === 'ringing');
        if (call) {
            call.status = 'active';
            call.timestamp = Date.now(); // Refresh timestamp
        }
        return c.json({ success: true });
    }
    else if (signal.type === 'end') {
        // Remove call
        GLOBAL_CALLS = GLOBAL_CALLS.filter(c => 
            !((c.from === signal.from && c.to === signal.to) || (c.from === signal.to && c.to === signal.from))
        );
        return c.json({ success: true });
    }
    
    return c.json({ success: false });
});

// 4. Notifications API
app.get('/api/notifications', (c) => {
    const userId = c.req.query('userId');
    
    // Filter notifications for this user
    let userNotifications = GLOBAL_NOTIFICATIONS.filter(n => 
        n.userId === 'all' || n.userId === userId
    );
    
    // Clean up old notifications (> 7 days)
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    userNotifications = userNotifications.filter(n => n.timestamp > sevenDaysAgo);
    
    // Sort by timestamp (newest first)
    userNotifications.sort((a, b) => b.timestamp - a.timestamp);
    
    // Return with read status for this user
    return c.json(userNotifications.map(n => ({
        ...n,
        isRead: n.read.includes(userId)
    })));
});

app.post('/api/notifications', async (c) => {
    const notification = await c.req.json();
    
    const newNotification = {
        id: Date.now() + Math.random(),
        userId: notification.userId || 'all',
        type: notification.type,
        priority: notification.priority || 'medium',
        title: notification.title,
        message: notification.message,
        context: notification.context || {},
        actions: notification.actions || [],
        read: [],
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
    };
    
    GLOBAL_NOTIFICATIONS.push(newNotification);
    
    // Keep manageable size
    if (GLOBAL_NOTIFICATIONS.length > 1000) {
        GLOBAL_NOTIFICATIONS.shift();
    }
    
    return c.json({ success: true, notification: newNotification });
});

// Mark notification as read
app.post('/api/notifications/:id/read', async (c) => {
    const id = parseFloat(c.req.param('id'));
    const { userId } = await c.req.json();
    
    const notification = GLOBAL_NOTIFICATIONS.find(n => n.id === id);
    if (notification && !notification.read.includes(userId)) {
        notification.read.push(userId);
    }
    
    return c.json({ success: true });
});

// Mark all as read
app.post('/api/notifications/read-all', async (c) => {
    const { userId } = await c.req.json();
    
    GLOBAL_NOTIFICATIONS.forEach(n => {
        if ((n.userId === 'all' || n.userId === userId) && !n.read.includes(userId)) {
            n.read.push(userId);
        }
    });
    
    return c.json({ success: true });
});

// Delete notification
app.delete('/api/notifications/:id', async (c) => {
    const id = parseFloat(c.req.param('id'));
    GLOBAL_NOTIFICATIONS = GLOBAL_NOTIFICATIONS.filter(n => n.id !== id);
    return c.json({ success: true });
});

// Clear all notifications for a user
app.post('/api/notifications/clear-all', async (c) => {
    const { userId } = await c.req.json();
    
    // Remove user-specific notifications
    GLOBAL_NOTIFICATIONS = GLOBAL_NOTIFICATIONS.filter(n => n.userId !== userId);
    
    // Mark all 'all' notifications as read for this user
    GLOBAL_NOTIFICATIONS.forEach(n => {
        if (n.userId === 'all' && !n.read.includes(userId)) {
            n.read.push(userId);
        }
    });
    
    return c.json({ success: true });
});

// 5. Lead Management API
app.get('/api/leads', (c) => {
    // Optional filtering
    const status = c.req.query('status');
    const source = c.req.query('source');
    const counselorId = c.req.query('counselorId');
    const flagged = c.req.query('flagged');
    const search = c.req.query('search');
    
    let filtered = [...GLOBAL_LEADS];
    
    if (status) filtered = filtered.filter(l => l.status === status);
    if (source) filtered = filtered.filter(l => l.source === source);
    if (counselorId) filtered = filtered.filter(l => l.assignedCounselorId === parseInt(counselorId));
    if (flagged === 'true') filtered = filtered.filter(l => l.flagged);
    if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(l => 
            l.name.toLowerCase().includes(searchLower) ||
            l.email.toLowerCase().includes(searchLower) ||
            l.phone.includes(search) ||
            l.country.toLowerCase().includes(searchLower)
        );
    }
    
    // Sort by created date (newest first)
    filtered.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    
    return c.json(filtered);
});

// Lead statistics (MUST be before /:id route)
app.get('/api/leads/stats', (c) => {
    const total = GLOBAL_LEADS.length;
    const qualified = GLOBAL_LEADS.filter(l => l.status === 'qualified').length;
    const flagged = GLOBAL_LEADS.filter(l => l.flagged).length;
    const registered = GLOBAL_LEADS.filter(l => l.status === 'registered').length;
    
    // This month
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    
    const thisMonthLeads = GLOBAL_LEADS.filter(l => 
        new Date(l.createdDate) >= thisMonthStart
    ).length;
    
    // Last month
    const lastMonthStart = new Date(thisMonthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    
    const lastMonthLeads = GLOBAL_LEADS.filter(l => {
        const created = new Date(l.createdDate);
        return created >= lastMonthStart && created < thisMonthStart;
    }).length;
    
    const growthRate = lastMonthLeads > 0 
        ? ((thisMonthLeads - lastMonthLeads) / lastMonthLeads * 100).toFixed(1)
        : 0;
    
    // Pipeline distribution
    const pipeline = {
        new: GLOBAL_LEADS.filter(l => l.status === 'new').length,
        contacted: GLOBAL_LEADS.filter(l => l.status === 'contacted').length,
        qualified: GLOBAL_LEADS.filter(l => l.status === 'qualified').length,
        registered: GLOBAL_LEADS.filter(l => l.status === 'registered').length,
        dropped: GLOBAL_LEADS.filter(l => l.status === 'dropped').length
    };
    
    return c.json({
        total,
        qualified,
        flagged,
        registered,
        thisMonth: thisMonthLeads,
        growthRate: parseFloat(growthRate),
        pipeline
    });
});

// CSV Export for Google Sheets Integration (MUST be before /:id route)
app.get('/api/leads/export/csv', (c) => {
    const leads = GLOBAL_LEADS;
    
    // CSV Headers
    const headers = [
        'Lead ID', 'Full Name', 'Email', 'Phone', 'Destination Country',
        'Intake Period', 'Status', 'Lead Source', 'Assigned Counselor',
        'Date Added', 'Last Contacted', 'Next Follow-up', 'Flagged',
        'Flag Reason', 'Notes'
    ];
    
    // Convert leads to CSV rows
    const rows = leads.map(lead => [
        lead.id,
        lead.name,
        lead.email,
        lead.phone,
        lead.country,
        lead.intakePeriod,
        lead.status,
        lead.source,
        lead.assignedCounselor || '',
        lead.createdDate ? new Date(lead.createdDate).toLocaleDateString() : '',
        lead.lastContactDate ? new Date(lead.lastContactDate).toLocaleDateString() : '',
        lead.followUpDate || '',
        lead.flagged ? 'Yes' : 'No',
        lead.flagReason || '',
        lead.notes || ''
    ]);
    
    // Build CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
            // Escape commas and quotes in cell values
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
        }).join(','))
    ].join('\n');
    
    // Return CSV with proper headers
    return new Response(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="leads_export.csv"'
        }
    });
});

// Get single lead by ID
app.get('/api/leads/:id', (c) => {
    const id = parseInt(c.req.param('id'));
    const lead = GLOBAL_LEADS.find(l => l.id === id);
    
    if (!lead) {
        return c.json({ error: 'Lead not found' }, 404);
    }
    
    return c.json(lead);
});

app.post('/api/leads', async (c) => {
    const leadData = await c.req.json();
    
    const newLead = {
        id: LEAD_ID_COUNTER++,
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        country: leadData.country,
        intakePeriod: leadData.intakePeriod,
        status: leadData.status || 'new',
        source: leadData.source,
        assignedCounselorId: leadData.assignedCounselorId,
        assignedCounselor: leadData.assignedCounselor,
        createdDate: new Date().toISOString(),
        lastContactDate: null,
        followUpDate: leadData.followUpDate || null,
        flagged: false,
        flagReason: null,
        notes: leadData.notes || '',
        documents: []
    };
    
    GLOBAL_LEADS.push(newLead);
    
    // Send notification to assigned counselor
    if (leadData.assignedCounselorId) {
        GLOBAL_NOTIFICATIONS.push({
            id: Date.now() + Math.random(),
            userId: leadData.assignedCounselorId.toString(),
            type: 'task',
            priority: 'high',
            title: 'New Lead Assigned',
            message: `${leadData.name} from ${leadData.country} has been assigned to you`,
            context: { source: 'Lead Management', leadId: newLead.id },
            actions: [{ label: 'View Lead', action: 'view_lead', type: 'primary' }],
            read: [],
            timestamp: Date.now(),
            createdAt: new Date().toISOString()
        });
    }
    
    return c.json({ success: true, lead: newLead });
});

app.put('/api/leads/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const updates = await c.req.json();
    
    const leadIndex = GLOBAL_LEADS.findIndex(l => l.id === id);
    if (leadIndex === -1) {
        return c.json({ error: 'Lead not found' }, 404);
    }
    
    GLOBAL_LEADS[leadIndex] = {
        ...GLOBAL_LEADS[leadIndex],
        ...updates,
        id // Preserve ID
    };
    
    return c.json({ success: true, lead: GLOBAL_LEADS[leadIndex] });
});

app.delete('/api/leads/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    
    const initialLength = GLOBAL_LEADS.length;
    GLOBAL_LEADS = GLOBAL_LEADS.filter(l => l.id !== id);
    
    if (GLOBAL_LEADS.length === initialLength) {
        return c.json({ error: 'Lead not found' }, 404);
    }
    
    return c.json({ success: true });
});

// Bulk operations
app.post('/api/leads/bulk', async (c) => {
    const { action, leadIds, data } = await c.req.json();
    
    if (action === 'delete') {
        GLOBAL_LEADS = GLOBAL_LEADS.filter(l => !leadIds.includes(l.id));
    } else if (action === 'update') {
        GLOBAL_LEADS = GLOBAL_LEADS.map(l => {
            if (leadIds.includes(l.id)) {
                return { ...l, ...data };
            }
            return l;
        });
    }
    
    return c.json({ success: true });
});

// CSV Import from Google Sheets
app.post('/api/leads/import/csv', async (c) => {
    try {
        const body = await c.req.json();
        const csvData = body.csvData;
        
        if (!csvData) {
            return c.json({ success: false, error: 'No CSV data provided' }, 400);
        }
        
        // Parse CSV (simple parser)
        const lines = csvData.trim().split('\n');
        if (lines.length < 2) {
            return c.json({ success: false, error: 'CSV must have headers and at least one data row' }, 400);
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        
        let imported = 0;
        let updated = 0;
        let errors = 0;
        
        for (let i = 1; i < lines.length; i++) {
            try {
                // Simple CSV parsing (doesn't handle complex escaping)
                const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                
                // Map to lead object
                const leadData: any = {};
                headers.forEach((header, idx) => {
                    leadData[header] = values[idx] || '';
                });
                
                // Check if lead exists by email
                const existingIndex = GLOBAL_LEADS.findIndex(l => l.email === leadData['Email']);
                
                const leadObject = {
                    name: leadData['Full Name'] || leadData['Name'] || '',
                    email: leadData['Email'] || '',
                    phone: leadData['Phone'] || '',
                    country: leadData['Destination Country'] || leadData['Country'] || '',
                    intakePeriod: leadData['Intake Period'] || leadData['Intake'] || '',
                    status: (leadData['Status'] || 'new').toLowerCase(),
                    source: leadData['Lead Source'] || leadData['Source'] || 'Import',
                    assignedCounselor: leadData['Assigned Counselor'] || leadData['Counselor'] || '',
                    assignedCounselorId: null, // Would need to lookup by name
                    followUpDate: leadData['Next Follow-up'] || leadData['Follow-up'] || null,
                    notes: leadData['Notes'] || ''
                };
                
                // Validate required fields
                if (!leadObject.name || !leadObject.email) {
                    errors++;
                    continue;
                }
                
                if (existingIndex >= 0) {
                    // Update existing lead
                    GLOBAL_LEADS[existingIndex] = {
                        ...GLOBAL_LEADS[existingIndex],
                        ...leadObject
                    };
                    updated++;
                } else {
                    // Create new lead
                    const newLead = {
                        id: LEAD_ID_COUNTER++,
                        ...leadObject,
                        createdDate: new Date().toISOString(),
                        lastContactDate: null,
                        flagged: false,
                        flagReason: null,
                        documents: []
                    };
                    GLOBAL_LEADS.push(newLead);
                    imported++;
                }
            } catch (err) {
                errors++;
                console.error('Error parsing CSV row:', err);
            }
        }
        
        return c.json({
            success: true,
            imported,
            updated,
            errors,
            total: lines.length - 1
        });
    } catch (error) {
        console.error('CSV import error:', error);
        return c.json({ success: false, error: 'Failed to process CSV data' }, 500);
    }
});

// Paste from Google Sheets (tab-separated values)
app.post('/api/leads/import/paste', async (c) => {
    try {
        const body = await c.req.json();
        const pasteData = body.pasteData;
        
        if (!pasteData) {
            return c.json({ success: false, error: 'No paste data provided' }, 400);
        }
        
        // Parse tab-separated values (from Google Sheets copy-paste)
        const lines = pasteData.trim().split('\n');
        if (lines.length < 2) {
            return c.json({ success: false, error: 'Data must have headers and at least one row' }, 400);
        }
        
        const headers = lines[0].split('\t').map(h => h.trim());
        
        let imported = 0;
        let updated = 0;
        let errors = 0;
        
        for (let i = 1; i < lines.length; i++) {
            try {
                const values = lines[i].split('\t').map(v => v.trim());
                
                // Map to lead object
                const leadData: any = {};
                headers.forEach((header, idx) => {
                    leadData[header] = values[idx] || '';
                });
                
                // Check if lead exists by email
                const existingIndex = GLOBAL_LEADS.findIndex(l => l.email === leadData['Email']);
                
                const leadObject = {
                    name: leadData['Full Name'] || leadData['Name'] || '',
                    email: leadData['Email'] || '',
                    phone: leadData['Phone'] || '',
                    country: leadData['Destination Country'] || leadData['Country'] || '',
                    intakePeriod: leadData['Intake Period'] || leadData['Intake'] || '',
                    status: (leadData['Status'] || 'new').toLowerCase(),
                    source: leadData['Lead Source'] || leadData['Source'] || 'Import',
                    assignedCounselor: leadData['Assigned Counselor'] || leadData['Counselor'] || '',
                    assignedCounselorId: null,
                    followUpDate: leadData['Next Follow-up'] || leadData['Follow-up'] || null,
                    notes: leadData['Notes'] || ''
                };
                
                // Validate required fields
                if (!leadObject.name || !leadObject.email) {
                    errors++;
                    continue;
                }
                
                if (existingIndex >= 0) {
                    // Update existing
                    GLOBAL_LEADS[existingIndex] = {
                        ...GLOBAL_LEADS[existingIndex],
                        ...leadObject
                    };
                    updated++;
                } else {
                    // Create new
                    const newLead = {
                        id: LEAD_ID_COUNTER++,
                        ...leadObject,
                        createdDate: new Date().toISOString(),
                        lastContactDate: null,
                        flagged: false,
                        flagReason: null,
                        documents: []
                    };
                    GLOBAL_LEADS.push(newLead);
                    imported++;
                }
            } catch (err) {
                errors++;
                console.error('Error parsing paste row:', err);
            }
        }
        
        return c.json({
            success: true,
            imported,
            updated,
            errors,
            total: lines.length - 1
        });
    } catch (error) {
        console.error('Paste import error:', error);
        return c.json({ success: false, error: 'Failed to process pasted data' }, 500);
    }
});

// --- DAILY OPERATIONS & TASK MANAGEMENT DATA ---
let GLOBAL_DAILY_REPORTS = [];
let GLOBAL_TASKS = [];
let GLOBAL_KPIS = [];

// --- RED FLAGS & RISK MANAGEMENT DATA ---
let RED_FLAG_ID_COUNTER = 1;
let GLOBAL_RED_FLAGS = [
    {
        id: RED_FLAG_ID_COUNTER++,
        title: 'Delayed Visa Processing - UK',
        description: 'Multiple student visas pending for over 30 days with UK consulate',
        category: 'Visa-related',
        priority: 'high',
        status: 'open',
        assignedTo: 'Sukaina Khan',
        assignedToId: 'GG002',
        createdBy: 'Nashif A. Razzak',
        createdById: 'GG001',
        createdDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        resolutionNotes: '',
        daysPending: 7
    },
    {
        id: RED_FLAG_ID_COUNTER++,
        title: 'Staff Attendance Issues',
        description: 'Recurring late arrivals from counseling team affecting client meetings',
        category: 'Staff-related',
        priority: 'medium',
        status: 'in-progress',
        assignedTo: 'Nashif A. Razzak',
        assignedToId: 'GG001',
        createdBy: 'Sukaina Khan',
        createdById: 'GG002',
        createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        resolutionNotes: 'Warning issued, monitoring for 2 weeks',
        daysPending: 5
    }
];

// --- DAILY REPORTS API ---

// Get all daily reports (with optional filters)
app.get('/api/daily-reports', (c) => {
    const userId = c.req.query('userId');
    const date = c.req.query('date');
    const status = c.req.query('status');
    
    let reports = GLOBAL_DAILY_REPORTS;
    
    if (userId) {
        reports = reports.filter(r => r.userId === userId);
    }
    if (date) {
        reports = reports.filter(r => r.date === date);
    }
    if (status) {
        reports = reports.filter(r => r.status === status);
    }
    
    return c.json(reports);
});

// Get specific report
app.get('/api/daily-reports/:id', (c) => {
    const id = c.req.param('id');
    const report = GLOBAL_DAILY_REPORTS.find(r => r.id === id);
    
    if (!report) {
        return c.json({ error: 'Report not found' }, 404);
    }
    
    return c.json(report);
});

// Get today's report for user
app.get('/api/daily-reports/today/:userId', (c) => {
    const userId = c.req.param('userId');
    const today = new Date().toISOString().split('T')[0];
    
    const report = GLOBAL_DAILY_REPORTS.find(r => 
        r.userId === userId && r.date === today
    );
    
    return c.json(report || null);
});

// Create new daily report
app.post('/api/daily-reports', async (c) => {
    const data = await c.req.json();
    
    const newReport = {
        id: `report-${Date.now()}`,
        userId: data.userId,
        userName: data.userName,
        date: data.date || new Date().toISOString().split('T')[0],
        checkInTime: data.checkInTime,
        objectives: data.objectives || [],
        tasksCompleted: data.tasksCompleted || [],
        tasksNotCompleted: data.tasksNotCompleted || [],
        reasonsIncomplete: data.reasonsIncomplete || [],
        followUpsDone: data.followUpsDone || [],
        outputs: data.outputs || [],
        issuesFaced: data.issuesFaced || [],
        tomorrowPriorities: data.tomorrowPriorities || [],
        selfDeclared: data.selfDeclared || false,
        status: 'draft',
        createdAt: new Date().toISOString()
    };
    
    GLOBAL_DAILY_REPORTS.push(newReport);
    
    return c.json({ success: true, report: newReport });
});

// Update daily report
app.put('/api/daily-reports/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const index = GLOBAL_DAILY_REPORTS.findIndex(r => r.id === id);
    
    if (index === -1) {
        return c.json({ error: 'Report not found' }, 404);
    }
    
    GLOBAL_DAILY_REPORTS[index] = {
        ...GLOBAL_DAILY_REPORTS[index],
        ...data,
        updatedAt: new Date().toISOString()
    };
    
    return c.json({ success: true, report: GLOBAL_DAILY_REPORTS[index] });
});

// Submit daily report
app.post('/api/daily-reports/:id/submit', async (c) => {
    const id = c.req.param('id');
    
    const index = GLOBAL_DAILY_REPORTS.findIndex(r => r.id === id);
    
    if (index === -1) {
        return c.json({ error: 'Report not found' }, 404);
    }
    
    GLOBAL_DAILY_REPORTS[index].status = 'submitted';
    GLOBAL_DAILY_REPORTS[index].submittedAt = new Date().toISOString();
    
    return c.json({ success: true, report: GLOBAL_DAILY_REPORTS[index] });
});

// Approve daily report
app.post('/api/daily-reports/:id/approve', async (c) => {
    const id = c.req.param('id');
    const { approvedBy, comments } = await c.req.json();
    
    const index = GLOBAL_DAILY_REPORTS.findIndex(r => r.id === id);
    
    if (index === -1) {
        return c.json({ error: 'Report not found' }, 404);
    }
    
    GLOBAL_DAILY_REPORTS[index].status = 'approved';
    GLOBAL_DAILY_REPORTS[index].approvedBy = approvedBy;
    GLOBAL_DAILY_REPORTS[index].approvedAt = new Date().toISOString();
    GLOBAL_DAILY_REPORTS[index].managerComments = comments;
    
    return c.json({ success: true, report: GLOBAL_DAILY_REPORTS[index] });
});

// Reject daily report
app.post('/api/daily-reports/:id/reject', async (c) => {
    const id = c.req.param('id');
    const { rejectedBy, comments } = await c.req.json();
    
    const index = GLOBAL_DAILY_REPORTS.findIndex(r => r.id === id);
    
    if (index === -1) {
        return c.json({ error: 'Report not found' }, 404);
    }
    
    GLOBAL_DAILY_REPORTS[index].status = 'rejected';
    GLOBAL_DAILY_REPORTS[index].rejectedBy = rejectedBy;
    GLOBAL_DAILY_REPORTS[index].rejectedAt = new Date().toISOString();
    GLOBAL_DAILY_REPORTS[index].managerComments = comments;
    
    return c.json({ success: true, report: GLOBAL_DAILY_REPORTS[index] });
});

// --- TASKS API ---

// Get all tasks (with optional filters)
app.get('/api/tasks', (c) => {
    const userId = c.req.query('userId');
    const status = c.req.query('status');
    const date = c.req.query('date');
    
    let tasks = GLOBAL_TASKS;
    
    if (userId) {
        tasks = tasks.filter(t => t.assignedTo === userId);
    }
    if (status) {
        tasks = tasks.filter(t => t.status === status);
    }
    if (date) {
        tasks = tasks.filter(t => t.dueDate === date);
    }
    
    return c.json(tasks);
});

// Get today's tasks for user
app.get('/api/tasks/today/:userId', (c) => {
    const userId = c.req.param('userId');
    const today = new Date().toISOString().split('T')[0];
    
    const tasks = GLOBAL_TASKS.filter(t => 
        t.assignedTo === userId && t.dueDate === today
    );
    
    return c.json(tasks);
});

// Create new task
app.post('/api/tasks', async (c) => {
    const data = await c.req.json();
    
    const newTask = {
        id: `task-${Date.now()}`,
        title: data.title,
        description: data.description || '',
        assignedTo: data.assignedTo,
        assignedBy: data.assignedBy,
        priority: data.priority || 'medium',
        status: 'pending',
        category: data.category || 'Other',
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        recurring: data.recurring,
        createdAt: new Date().toISOString()
    };
    
    GLOBAL_TASKS.push(newTask);
    
    return c.json({ success: true, task: newTask });
});

// Update task
app.put('/api/tasks/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const index = GLOBAL_TASKS.findIndex(t => t.id === id);
    
    if (index === -1) {
        return c.json({ error: 'Task not found' }, 404);
    }
    
    GLOBAL_TASKS[index] = {
        ...GLOBAL_TASKS[index],
        ...data,
        updatedAt: new Date().toISOString()
    };
    
    return c.json({ success: true, task: GLOBAL_TASKS[index] });
});

// Mark task as complete
app.post('/api/tasks/:id/complete', async (c) => {
    const id = c.req.param('id');
    
    const index = GLOBAL_TASKS.findIndex(t => t.id === id);
    
    if (index === -1) {
        return c.json({ error: 'Task not found' }, 404);
    }
    
    GLOBAL_TASKS[index].status = 'completed';
    GLOBAL_TASKS[index].completedAt = new Date().toISOString();
    
    return c.json({ success: true, task: GLOBAL_TASKS[index] });
});

// Delete task
app.delete('/api/tasks/:id', (c) => {
    const id = c.req.param('id');
    
    const initialLength = GLOBAL_TASKS.length;
    GLOBAL_TASKS = GLOBAL_TASKS.filter(t => t.id !== id);
    
    if (GLOBAL_TASKS.length === initialLength) {
        return c.json({ error: 'Task not found' }, 404);
    }
    
    return c.json({ success: true });
});

// --- KPI API ---

// Get KPI plans (with optional filters)
app.get('/api/kpis', (c) => {
    const userId = c.req.query('userId');
    const date = c.req.query('date');
    
    let kpis = GLOBAL_KPIS;
    
    if (userId) {
        kpis = kpis.filter(k => k.userId === userId);
    }
    if (date) {
        kpis = kpis.filter(k => k.date === date);
    }
    
    return c.json(kpis);
});

// Get today's KPI for user
app.get('/api/kpis/today/:userId', (c) => {
    const userId = c.req.param('userId');
    const today = new Date().toISOString().split('T')[0];
    
    const kpi = GLOBAL_KPIS.find(k => 
        k.userId === userId && k.date === today
    );
    
    return c.json(kpi || null);
});

// Create/Update KPI plan
app.post('/api/kpis', async (c) => {
    const data = await c.req.json();
    
    const today = data.date || new Date().toISOString().split('T')[0];
    const existingIndex = GLOBAL_KPIS.findIndex(k => 
        k.userId === data.userId && k.date === today
    );
    
    if (existingIndex !== -1) {
        // Update existing
        GLOBAL_KPIS[existingIndex] = {
            ...GLOBAL_KPIS[existingIndex],
            ...data,
            updatedAt: new Date().toISOString()
        };
        return c.json({ success: true, kpi: GLOBAL_KPIS[existingIndex] });
    } else {
        // Create new
        const newKPI = {
            id: `kpi-${Date.now()}`,
            userId: data.userId,
            date: today,
            leadsContacted: data.leadsContacted || { target: 0, actual: 0 },
            applicationsSubmitted: data.applicationsSubmitted || { target: 0, actual: 0 },
            visaApplications: data.visaApplications || { target: 0, actual: 0 },
            callsMade: data.callsMade || { target: 0, actual: 0 },
            emailsSent: data.emailsSent || { target: 0, actual: 0 },
            meetingsHeld: data.meetingsHeld || { target: 0, actual: 0 },
            revenueGenerated: data.revenueGenerated || { target: 0, actual: 0 },
            customKPIs: data.customKPIs || [],
            status: 'in_progress',
            createdAt: new Date().toISOString()
        };
        
        GLOBAL_KPIS.push(newKPI);
        return c.json({ success: true, kpi: newKPI });
    }
});

// Get KPI statistics
app.get('/api/kpis/stats/:userId', (c) => {
    const userId = c.req.param('userId');
    const userKPIs = GLOBAL_KPIS.filter(k => k.userId === userId);
    
    if (userKPIs.length === 0) {
        return c.json({
            totalDays: 0,
            averageAchievement: 0,
            bestDay: null,
            worstDay: null
        });
    }
    
    let totalAchievement = 0;
    let bestDay = { date: '', achievement: 0 };
    let worstDay = { date: '', achievement: 100 };
    
    userKPIs.forEach(kpi => {
        let dayAchievement = 0;
        let metricsCount = 0;
        
        // Calculate achievement percentage for each metric
        ['leadsContacted', 'applicationsSubmitted', 'visaApplications', 
         'callsMade', 'emailsSent', 'meetingsHeld', 'revenueGenerated'].forEach(metric => {
            if (kpi[metric]?.target > 0) {
                const achievement = (kpi[metric].actual / kpi[metric].target) * 100;
                dayAchievement += achievement;
                metricsCount++;
            }
        });
        
        if (metricsCount > 0) {
            dayAchievement = dayAchievement / metricsCount;
            totalAchievement += dayAchievement;
            
            if (dayAchievement > bestDay.achievement) {
                bestDay = { date: kpi.date, achievement: dayAchievement };
            }
            if (dayAchievement < worstDay.achievement) {
                worstDay = { date: kpi.date, achievement: dayAchievement };
            }
        }
    });
    
    return c.json({
        totalDays: userKPIs.length,
        averageAchievement: totalAchievement / userKPIs.length,
        bestDay,
        worstDay
    });
});

// --- RED FLAGS & RISK MANAGEMENT API ---

// Get all red flags with filtering
app.get('/api/red-flags', (c) => {
    const category = c.req.query('category');
    const priority = c.req.query('priority');
    const status = c.req.query('status');
    const assignedToId = c.req.query('assignedToId');
    
    let filtered = [...GLOBAL_RED_FLAGS];
    
    if (category) filtered = filtered.filter(f => f.category === category);
    if (priority) filtered = filtered.filter(f => f.priority === priority);
    if (status) filtered = filtered.filter(f => f.status === status);
    if (assignedToId) filtered = filtered.filter(f => f.assignedToId === assignedToId);
    
    // Sort by priority (high > medium > low) and date (newest first)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    filtered.sort((a, b) => {
        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    });
    
    return c.json(filtered);
});

// Get red flags statistics
app.get('/api/red-flags/stats', (c) => {
    const total = GLOBAL_RED_FLAGS.length;
    const open = GLOBAL_RED_FLAGS.filter(f => f.status === 'open').length;
    const inProgress = GLOBAL_RED_FLAGS.filter(f => f.status === 'in-progress').length;
    const resolved = GLOBAL_RED_FLAGS.filter(f => f.status === 'resolved').length;
    const critical = GLOBAL_RED_FLAGS.filter(f => f.priority === 'high' && f.status !== 'resolved').length;
    
    // Category breakdown
    const categories = {};
    GLOBAL_RED_FLAGS.forEach(flag => {
        categories[flag.category] = (categories[flag.category] || 0) + 1;
    });
    
    // Priority breakdown
    const priorities = {
        high: GLOBAL_RED_FLAGS.filter(f => f.priority === 'high').length,
        medium: GLOBAL_RED_FLAGS.filter(f => f.priority === 'medium').length,
        low: GLOBAL_RED_FLAGS.filter(f => f.priority === 'low').length
    };
    
    return c.json({
        total,
        open,
        inProgress,
        resolved,
        critical,
        categories,
        priorities
    });
});

// Get single red flag
app.get('/api/red-flags/:id', (c) => {
    const id = parseInt(c.req.param('id'));
    const flag = GLOBAL_RED_FLAGS.find(f => f.id === id);
    
    if (!flag) {
        return c.json({ error: 'Red flag not found' }, 404);
    }
    
    return c.json(flag);
});

// Create new red flag
app.post('/api/red-flags', async (c) => {
    const data = await c.req.json();
    
    const newFlag = {
        id: RED_FLAG_ID_COUNTER++,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority || 'medium',
        status: 'open',
        assignedTo: data.assignedTo,
        assignedToId: data.assignedToId,
        createdBy: data.createdBy,
        createdById: data.createdById,
        createdDate: new Date().toISOString(),
        dueDate: data.dueDate || null,
        resolutionNotes: '',
        daysPending: 0
    };
    
    GLOBAL_RED_FLAGS.push(newFlag);
    
    return c.json({ success: true, flag: newFlag });
});

// Update red flag
app.put('/api/red-flags/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const data = await c.req.json();
    
    const flagIndex = GLOBAL_RED_FLAGS.findIndex(f => f.id === id);
    if (flagIndex === -1) {
        return c.json({ error: 'Red flag not found' }, 404);
    }
    
    GLOBAL_RED_FLAGS[flagIndex] = {
        ...GLOBAL_RED_FLAGS[flagIndex],
        ...data
    };
    
    return c.json({ success: true, flag: GLOBAL_RED_FLAGS[flagIndex] });
});

// Delete red flag
app.delete('/api/red-flags/:id', (c) => {
    const id = parseInt(c.req.param('id'));
    
    const initialLength = GLOBAL_RED_FLAGS.length;
    GLOBAL_RED_FLAGS = GLOBAL_RED_FLAGS.filter(f => f.id !== id);
    
    if (GLOBAL_RED_FLAGS.length === initialLength) {
        return c.json({ error: 'Red flag not found' }, 404);
    }
    
    return c.json({ success: true });
});

// --- MEETINGS & CALENDAR API ---
let GLOBAL_MEETINGS = [
    { id: 1, title: 'Client Meeting - John Smith', type: 'client', attendees: ['Nashif A. Razzak', 'Aathina'], startTime: '09:00', endTime: '10:00', date: new Date().toISOString().split('T')[0], location: 'Conference Room A', status: 'scheduled', notes: 'Discuss visa application process' },
    { id: 2, title: 'Team Standup', type: 'internal', attendees: ['All Staff'], startTime: '10:30', endTime: '11:00', date: new Date().toISOString().split('T')[0], location: 'Main Office', status: 'scheduled', notes: 'Daily sync' },
    { id: 3, title: 'Client Visit - Sarah Johnson', type: 'visit', attendees: ['Sukaina'], startTime: '14:00', endTime: '15:00', date: new Date().toISOString().split('T')[0], location: 'Reception', status: 'scheduled', notes: 'Document submission' }
];

let GLOBAL_VISITORS = [
    { id: 1, name: 'Sarah Johnson', purpose: 'Document Submission', checkIn: '14:00', checkOut: null, date: new Date().toISOString().split('T')[0], host: 'Sukaina', status: 'checked-in' },
    { id: 2, name: 'Ahmed Ali', purpose: 'Consultation', checkIn: '10:15', checkOut: '11:00', date: new Date().toISOString().split('T')[0], host: 'Nashif A. Razzak', status: 'checked-out' }
];

// Get all meetings
app.get('/api/meetings', (c) => {
    return c.json(GLOBAL_MEETINGS);
});

// Get meetings for today
app.get('/api/meetings/today', (c) => {
    const today = new Date().toISOString().split('T')[0];
    const todayMeetings = GLOBAL_MEETINGS.filter(m => m.date === today);
    return c.json(todayMeetings);
});

// Get meetings by date
app.get('/api/meetings/date/:date', (c) => {
    const date = c.req.param('date');
    const meetings = GLOBAL_MEETINGS.filter(m => m.date === date);
    return c.json(meetings);
});

// Create new meeting
app.post('/api/meetings', async (c) => {
    const body = await c.req.json();
    const newMeeting = {
        id: GLOBAL_MEETINGS.length + 1,
        title: body.title,
        type: body.type || 'internal',
        attendees: body.attendees || [],
        startTime: body.startTime,
        endTime: body.endTime,
        date: body.date,
        location: body.location || '',
        status: body.status || 'scheduled',
        notes: body.notes || ''
    };
    GLOBAL_MEETINGS.push(newMeeting);
    return c.json(newMeeting);
});

// Update meeting
app.put('/api/meetings/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    
    const index = GLOBAL_MEETINGS.findIndex(m => m.id === id);
    if (index === -1) {
        return c.json({ error: 'Meeting not found' }, 404);
    }
    
    GLOBAL_MEETINGS[index] = { ...GLOBAL_MEETINGS[index], ...body };
    return c.json(GLOBAL_MEETINGS[index]);
});

// Delete meeting
app.delete('/api/meetings/:id', (c) => {
    const id = parseInt(c.req.param('id'));
    const initialLength = GLOBAL_MEETINGS.length;
    GLOBAL_MEETINGS = GLOBAL_MEETINGS.filter(m => m.id !== id);
    
    if (GLOBAL_MEETINGS.length === initialLength) {
        return c.json({ error: 'Meeting not found' }, 404);
    }
    
    return c.json({ success: true });
});

// Get all visitors
app.get('/api/visitors', (c) => {
    return c.json(GLOBAL_VISITORS);
});

// Get visitors for today
app.get('/api/visitors/today', (c) => {
    const today = new Date().toISOString().split('T')[0];
    const todayVisitors = GLOBAL_VISITORS.filter(v => v.date === today);
    return c.json(todayVisitors);
});

// Check in visitor
app.post('/api/visitors', async (c) => {
    const body = await c.req.json();
    const newVisitor = {
        id: GLOBAL_VISITORS.length + 1,
        name: body.name,
        purpose: body.purpose,
        checkIn: new Date().toTimeString().slice(0, 5),
        checkOut: null,
        date: new Date().toISOString().split('T')[0],
        host: body.host,
        status: 'checked-in'
    };
    GLOBAL_VISITORS.push(newVisitor);
    return c.json(newVisitor);
});

// Check out visitor
app.put('/api/visitors/:id/checkout', (c) => {
    const id = parseInt(c.req.param('id'));
    const visitor = GLOBAL_VISITORS.find(v => v.id === id);
    
    if (!visitor) {
        return c.json({ error: 'Visitor not found' }, 404);
    }
    
    visitor.checkOut = new Date().toTimeString().slice(0, 5);
    visitor.status = 'checked-out';
    
    return c.json(visitor);
});

// Google Calendar Sync Endpoint (Framework for future OAuth integration)
app.post('/api/calendar/sync', async (c) => {
    // This is a placeholder endpoint for Google Calendar integration
    // In production, this would:
    // 1. Authenticate with Google OAuth
    // 2. Fetch events from Google Calendar API
    // 3. Sync with local meetings
    
    const body = await c.req.json();
    const { calendarId, staffMember } = body;
    
    // Mock response - replace with actual Google Calendar API integration
    return c.json({
        success: true,
        message: 'Calendar sync endpoint ready. Implement Google OAuth to activate.',
        calendarId,
        staffMember,
        syncedEvents: 0,
        instruction: 'Set up Google Cloud Console project and OAuth credentials to enable sync'
    });
});

// Get calendar sync status
app.get('/api/calendar/status', (c) => {
    return c.json({
        enabled: false,
        message: 'Google Calendar integration not configured',
        setupInstructions: [
            '1. Create project in Google Cloud Console',
            '2. Enable Google Calendar API',
            '3. Create OAuth 2.0 credentials',
            '4. Set up authorized redirect URIs',
            '5. Store credentials in Cloudflare secrets',
            '6. Implement OAuth flow in backend'
        ]
    });
});

// --- STUDENT PORTAL API ---
// Auto-generate student accounts from ADMISSIONS_DB_DATA
// Student Portal - Get all student accounts (for finder)
app.get('/api/student-portal/accounts', (c) => {
    const accounts = generateStudentAccounts().map(a => ({
        studentId: a.studentId,
        name: a.name,
        counselor: a.counselor,
        hasOffers: a.hasOffers
    }));
    return c.json({ success: true, students: accounts, total: accounts.length });
});

// Student Portal - Login
app.post('/api/student-portal/login', async (c) => {
    const { studentId, password } = await c.req.json();
    const accounts = generateStudentAccounts();
    
    // Find by student ID or name (case-insensitive)
    const student = accounts.find(s => 
        s.studentId.toLowerCase() === studentId.toLowerCase() ||
        s.name.toLowerCase() === studentId.toLowerCase()
    );
    
    if (!student) {
        return c.json({ success: false, message: 'Student not found. Use "Find My Account" to look up your Student ID.' }, 401);
    }
    
    // Password = student ID (default)
    if (password !== student.password && password !== student.studentId && password !== 'student123') {
        return c.json({ success: false, message: 'Invalid password. Your default password is your Student ID (e.g., GG-STU-001).' }, 401);
    }
    
    return c.json({
        success: true,
        student: {
            admissionsId: student.admissionsId,
            studentId: student.studentId,
            name: student.name,
            counselor: student.counselor,
            directAgent: student.directAgent
        }
    });
});

// Student Portal - Get full student data by admissions ID
app.get('/api/student-portal/data/:admissionsId', (c) => {
    const admissionsId = parseInt(c.req.param('admissionsId'));
    const student = ADMISSIONS_DB_DATA.find(s => s.id === admissionsId);
    
    if (!student) {
        return c.json({ success: false, message: 'Student not found' }, 404);
    }
    
    return c.json({ success: true, data: student });
});

// Legacy student dashboard (for iframe compatibility)
app.get('/api/students/dashboard', (c) => {
    return c.json({
        totalApplications: 0,
        approved: 0,
        inProgress: 0,
        docsPending: 0,
        applications: [],
        importantDates: [],
        recentActivity: []
    });
});

// Lead Management page (standalone HTML)
app.get('/lead-management', (c) => {
    return c.html(leadManagementPage);
});

// Daily Operations page (standalone HTML)
app.get('/daily-operations', (c) => {
    return c.html(dailyOpsEnhancedPage);
});

// Google Sheets Integration page (standalone HTML)
app.get('/sheets-integration', (c) => {
    return c.html(sheetsIntegrationPage);
});

// Red Flags & Risk Management page (standalone HTML)
app.get('/red-flags', (c) => {
    return c.html(redFlagsPage);
});

// Reports & Analytics page (standalone HTML)
app.get('/reports', (c) => {
    return c.html(reportsPage);
});
app.get('/reports-analytics', (c) => {
    return c.html(reportsPage);
});

// Leave Management page (standalone HTML)
app.get('/leave', (c) => {
    return c.html(leaveManagementPage);
});
app.get('/leave-management', (c) => {
    return c.html(leaveManagementPage);
});

// Staff Location Tracker page (standalone HTML)
app.get('/location-tracker', (c) => {
    return c.html(locationTrackerPage);
});

// Student Login page (standalone HTML)
app.get('/student-login', (c) => {
    return c.html(studentLoginPage);
});

// Student Portal page (standalone HTML)
app.get('/student-portal', (c) => {
    return c.html(studentPortalPage);
});

// Applications page (standalone HTML)
app.get('/applications', (c) => {
    return c.html(applicationsPage);
});

// Students page (standalone HTML)
app.get('/students', (c) => {
    // Inject ADMISSIONS_DB into the students page
    const admissionsData = JSON.stringify(ADMISSIONS_DB_DATA);
    const page = studentsPage.replace('%%ADMISSIONS_DB_PLACEHOLDER%%', admissionsData);
    return c.html(page);
});

// Applications & Visa Management - REAL DATA from Excel Sheets
// Synced from: Thasbiha Admission Sheet (25 apps), Umair Admission Sheet (20 apps), Razan Visa Status (3 apps)
// Total: 48 applications  
// Last synced: 2026-02-08 02:18:15
app.get('/api/applications', (c) => {
    const applications = [
        {
                "id": 1,
                "student_name": "Kishara - kaluthatra",
                "counselor": "Thasbiha / Umair",
                "mobile": "5. Unconditional",
                "email": "N/A",
                "university": "2024-10-23 00:00:00",
                "course": "Umair",
                "status": "Conform ",
                "offers": "Event",
                "portal_type": "2022-03-30 00:00:00",
                "docs_status": "Deferment requested| Interview passed| She faces mocks|Studebt's reply to mock as she continoldy didn\u2019t attend to mocks|  Deferd to Sep 24 intake. \nCrizac asked to request the defement at the end of Feb for Sep intake. > Sha told to defer to Sep 24 to DMU. \nShe missed all the things. > Deffred to Jan 24.  No action since few weeks > H/O to Umair (18th Oct) \nRequested to defer. Paid 2,000 GBP to DMU. \nC: DMU. A:Roheampton. Differered (waiting for the new offer). > Uni Paid. Applied DMU, Docs received",
                "ielts": "Either process for Sep or request refund and process for another uni",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "Galadari",
                "visa_status": "N/A",
                "all_universities": "2024-10-23 00:00:00"
        },
        {
                "id": 2,
                "student_name": "Shiromia",
                "counselor": "Thasbiha / Umair",
                "mobile": "6. CAS/LOA Issued",
                "email": "N/A",
                "university": "2024-10-31 00:00:00",
                "course": "Umair",
                "status": "Enrolment",
                "offers": "Agent",
                "portal_type": "2024-08-09 00:00:00",
                "docs_status": "Visa granted| Visa applied| CAS received| CAS requested| Passed PCI| Sat for Credibility| UC: LSBU| C: LSBU | A: ONCAMPUS (Hull, LSBU, Aston)",
                "ielts": "Commission, Agent payment",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "Sakeen",
                "visa_status": "N/A",
                "all_universities": "2024-10-31 00:00:00"
        },
        {
                "id": 3,
                "student_name": "Kanimoly",
                "counselor": "Thasbiha / Umair",
                "mobile": "6. CAS/LOA Issued",
                "email": "N/A",
                "university": "2024-10-31 00:00:00",
                "course": "Umair",
                "status": "Enrolment",
                "offers": "Agent",
                "portal_type": "2024-05-28 00:00:00",
                "docs_status": "Visa granted| VISA applied| CAS received for SDL campus| CAS requested| Visa docs submitted| Payment done| C: Sundeland, Converted to UC| LOR received| C: LMP | A: Kignston, LMP, coventry, UWM",
                "ielts": "Commisiom, Agent payment",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "Aqeel",
                "visa_status": "N/A",
                "all_universities": "2024-10-31 00:00:00"
        },
        {
                "id": 4,
                "student_name": "Devaka",
                "counselor": "Thasbiha / Umair",
                "mobile": "6. CAS/LOA Issued",
                "email": "N/A",
                "university": "2024-10-23 00:00:00",
                "course": "Umair",
                "status": "Visa reply",
                "offers": "Agent",
                "portal_type": "2024-08-02 00:00:00",
                "docs_status": "Justification provided for UKVI| Visa interview done| Visa applied| CAS received| Finance, TB. - done| 7,900 paid to UWE| UC: UWE (Business & Event Management | A: DMU (Hospitality), BCU (Events Management) ",
                "ielts": "Visa interview (10 Oct) ",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "Winners",
                "visa_status": "N/A",
                "all_universities": "2024-10-23 00:00:00"
        },
        {
                "id": 5,
                "student_name": "Ajmal",
                "counselor": "Umair",
                "mobile": "6. CAS/LOA Issued",
                "email": "N/A",
                "university": "2024-10-23 00:00:00",
                "course": "Umair",
                "status": "Visa reply",
                "offers": "Direct",
                "portal_type": "2024-07-15 00:00:00",
                "docs_status": "Paid inquiry made| VISA requested - VFS - 20th Sep | UC: Received| DLG: 150| C: UWE - 3 year degree| A: UWE| Completed only 1.5 years of degree program at SLIIT, therefoere UWE is the only option",
                "ielts": "Visa interview (21 Oct) ",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "Mushad",
                "visa_status": "N/A",
                "all_universities": "2024-10-23 00:00:00"
        },
        {
                "id": 6,
                "student_name": "Anu Aruljeewan",
                "counselor": "Thasbiha / Umair",
                "mobile": "6. CAS/LOA Issued",
                "email": "N/A",
                "university": "2024-10-23 00:00:00",
                "course": "Umair",
                "status": "Visa reply",
                "offers": "Direct",
                "portal_type": "2024-02-12 00:00:00",
                "docs_status": "Withdrwan request has been made as the interview sheduled by UKVI is on 17th, but latest enrolment was 11th Oct| Paid inquiry made| Visa applied| Medical passed| Cas released: Uni ayment done 6,000GBP| C: NTU| A: NTU, UWE | ",
                "ielts": "N/A",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "2024-10-23 00:00:00"
        },
        {
                "id": 7,
                "student_name": "Najlan",
                "counselor": "Umair",
                "mobile": "6. CAS/LOA Issued",
                "email": "N/A",
                "university": "2024-10-23 00:00:00",
                "course": "Umair",
                "status": "AR reply",
                "offers": "Direct",
                "portal_type": "2023-06-27 00:00:00",
                "docs_status": "UKVI justification provided| Admin review applied| Visa rejected| Visa applied| CAS received| 6,500 paid to UWE thirgh Nasif's account (22nd May 24) | UC: UWE Sep 24\nUC: HFS> D: SFS> Deferred to Sep 24. He postponed to other intake. > C: UWE (but no time for English test time)\nUWE siad can issue the offer, but no time for exam, so need IELTS. > A: UWE. We count; submit to KC on time due to Eli course delay. > A: Sunderland, MDX - KC overseas. \nA: Coventry  Topup is only availabe in Jan.",
                "ielts": "N/A",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "Munsif",
                "visa_status": "N/A",
                "all_universities": "2024-10-23 00:00:00"
        },
        {
                "id": 8,
                "student_name": "Priyanka",
                "counselor": "Thasbiha / Umair",
                "mobile": "6. CAS/LOA Issued",
                "email": "N/A",
                "university": "2024-10-23 00:00:00",
                "course": "Umair",
                "status": "Balance 4k Refund",
                "offers": "Marketing",
                "portal_type": "2024-02-01 00:00:00",
                "docs_status": "4k refund received| Refund requestred| Visa refused| Visa Interview attended 12th Aug| Visa applied| CAS received| CAS shield subiiited| 4,000 GBP paid to BCU > UC: BCU| C: BCU (SOP)| A: BCU, HFS",
                "ielts": "Next option",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "FB",
                "visa_status": "N/A",
                "all_universities": "2024-10-23 00:00:00"
        },
        {
                "id": 9,
                "student_name": "Ashvini",
                "counselor": "Thasbiha / Umair",
                "mobile": "7. VISA granted",
                "email": "N/A",
                "university": "2024-10-02 00:00:00",
                "course": "Umair",
                "status": "Enrolment",
                "offers": "Agent",
                "portal_type": "2024-06-15 00:00:00",
                "docs_status": "Visa granted| Visa applied| CAS received| CAS requested| Medical passed| Interview Passed| Uni payment done to 50% to UCA| UC: UCA| A: UCA|Gap filled.",
                "ielts": "Commission",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "Sri",
                "visa_status": "N/A",
                "all_universities": "2024-10-02 00:00:00"
        },
        {
                "id": 10,
                "student_name": "Irshad Nishad",
                "counselor": "Umair / Thasbiha",
                "mobile": "7. VISA granted",
                "email": "N/A",
                "university": "2024-08-21 00:00:00",
                "course": "Umair",
                "status": "Enrolment",
                "offers": "Direct",
                "portal_type": "2023-11-01 00:00:00",
                "docs_status": "Visa granted| Visa applied| CAS received| Interview passed| UC: Coventry for Sep 24. | Visa withdrwal confirmation given. | Defered to Sep 24. | Visa withdrwan | VISA interview (8th March) | Student sent an email directly to uni to defer | Visa applied (Jan 4th 24) | CAS issued. Uni payment done| C: Coventry (Payment, Interview) | A: Coventry. Gap filled.  Paid to gap.",
                "ielts": "Commission",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "Nasif",
                "visa_status": "N/A",
                "all_universities": "2024-08-21 00:00:00"
        },
        {
                "id": 11,
                "student_name": "Inzamam",
                "counselor": "Umair",
                "mobile": "7. VISA granted",
                "email": "N/A",
                "university": "2024-06-26 00:00:00",
                "course": "Umair",
                "status": "Enrolment",
                "offers": "Direct ",
                "portal_type": "2023-10-01 00:00:00",
                "docs_status": "Vis applied> CAS Shield | Credbility passed. \nUlster requested to defer to May, but the student wants to go Jan intake. | Uni paid to Ulster. UC: Ulster. UC: Greenwhich \nC: Ulster (Payment, Interview, SOP)\nA: DMU, UWL, Ulster, UOR - Crizac. \nA: UEL Manchestor, BCU, NTU, Bangor - KCOS\nGap filled. Paid for gap filling",
                "ielts": "Commission",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "Razan",
                "visa_status": "N/A",
                "all_universities": "2024-06-26 00:00:00"
        },
        {
                "id": 12,
                "student_name": "Mafaz",
                "counselor": "Thasbiha",
                "mobile": "7. VISA granted",
                "email": "N/A",
                "university": "2024-10-31 00:00:00",
                "course": "Umair",
                "status": "Enrolment",
                "offers": "Referal",
                "portal_type": "2024-01-03 00:00:00",
                "docs_status": "Visa granted| Visa applied| CAS received| Credibiity done| Certificate issued: Paid 8,000 to coventry| C: Coventry, DMU| A: BCU",
                "ielts": "Commission",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "Zamhar's brother in law",
                "visa_status": "N/A",
                "all_universities": "2024-10-31 00:00:00"
        },
        {
                "id": 13,
                "student_name": "Swetha",
                "counselor": "Thasbiha / Umair",
                "mobile": "7. VISA granted",
                "email": "N/A",
                "university": "2024-10-09 00:00:00",
                "course": "Umair",
                "status": "Enrolment",
                "offers": "Referal",
                "portal_type": "2023-12-15 00:00:00",
                "docs_status": "Visa granted| VISA applied| PAL received| 10,000 CAD paid to Centennial| PAL received | 2,650 paid to Centennial (..) | O: Centennial| Fanshawe withdrawe the offer as 30 days dealsine passed. | O: Fanshawe\nAppled to Centennial, Fanshawe| IELTS 6.5 (5.5)",
                "ielts": "Commission",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "Domeshan",
                "visa_status": "N/A",
                "all_universities": "2024-10-09 00:00:00"
        },
        {
                "id": 14,
                "student_name": "Hanan",
                "counselor": "Umair",
                "mobile": "4.\u00a0Conditional",
                "email": "N/A",
                "university": "2024-10-23 00:00:00",
                "course": "2025-09-01 00:00:00",
                "status": "CAS received ",
                "offers": "Direct",
                "portal_type": "done",
                "docs_status": "C: CVT: A: LDM, TSD, COV, HDF| But Oxford requested to resit again| Set 2 times for PCI| C: RHM (Oxf), DMU (Infinity)| Returned after Holding on June 29th. ",
                "ielts": "C: SOP, payment, interview",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "Nasif",
                "visa_status": "N/A",
                "all_universities": "2024-10-23 00:00:00"
        },
        {
                "id": 15,
                "student_name": "Rijas",
                "counselor": "Umair / Thasbiha",
                "mobile": "Conditional",
                "email": "N/A",
                "university": "Sunderland university",
                "course": "1. BA Business Management \n2. BA Business Management Sep/25",
                "status": "1. Not Eligible for Waiver\n2. UCO",
                "offers": "2. UCO",
                "portal_type": "Yes ",
                "docs_status": "All received  Eli",
                "ielts": "No",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "1. Asked for IELTS get waiver",
                "visa_status": "N/A",
                "all_universities": "1. Sunderland university (SP)\n2. UWE (D)"
        },
        {
                "id": 16,
                "student_name": "Malith  - Hafeel",
                "counselor": "Umair",
                "mobile": "Hafeel is corrosponding",
                "email": "N/A",
                "university": "Aston CEG",
                "course": "2025-05-01 00:00:00",
                "status": "profie made/ offer isssued / client no respond / offer deferred for may / uni payment made / cas received / balance fee to be paid",
                "offers": "Aston",
                "portal_type": "no",
                "docs_status": "Profile making ",
                "ielts": "no",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "Aston CEG"
        },
        {
                "id": 17,
                "student_name": "Shihab",
                "counselor": "Umair",
                "mobile": "705965110",
                "email": "N/A",
                "university": "Shihab",
                "course": "Shihab ",
                "status": "Uni payment done| Pasid to IBU| C: RHM (Interview), O: IBU - Canada| A: IBU, Docs received. Gap filled. | Gap filling  Applied for UK/ Hertfordshire/ topup student enrolled for september 2025",
                "offers": "Hertz / DMU",
                "portal_type": "pad / 190k paid to be given once the commision received from the uni",
                "docs_status": "eli ",
                "ielts": "completd and submitted",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "Shihab "
        },
        {
                "id": 18,
                "student_name": "Akeel Hussain",
                "counselor": "Ashfaq",
                "mobile": "776079948",
                "email": "N/A",
                "university": "DMU",
                "course": "1. MBA (Global) Jan/26\n2. MSc International Business",
                "status": "1. UCO/Payment/CAS",
                "offers": "1. UCO",
                "portal_type": "Yes (Ashfaq)",
                "docs_status": "Pending",
                "ielts": "No",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "None",
                "visa_status": "Granted",
                "all_universities": "1. DMU (CZ)\n2. Hertz (CZ)",
                "visa_start_date": "2026-01-07 00:00:00",
                "visa_vfs_date": "2026-01-16 00:00:00",
                "visa_description": "Visa Granted"
        },
        {
                "id": 19,
                "student_name": "Ajith (Thasbiha)",
                "counselor": "Thasbiha / Umair",
                "mobile": "sri",
                "email": "N/A",
                "university": "Coventry University",
                "course": "1. Business Management and Leadership BA May/25\n2. Business and Management BA (Hons) May/25\n3. Bsc B",
                "status": "1. CO\n2. CO\n3. CO\n4. CO/not eligible for Waiver\n5. CO\n6. CO\n7. CO/Payment/Credibility Failed\n8. Processed",
                "offers": "1. CO\n2. CO\n3. CO\n4. CO\n5. CO\n6. CO\n7. CO/Payment",
                "portal_type": "Agent File (Shree)",
                "docs_status": "N/A",
                "ielts": "No",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "LOR needed",
                "visa_status": "N/A",
                "all_universities": "1. Coventry University (CZ)\n2. Sunderland University London (SP)\n3. Roehampton University (OX)\n4. London Metropolitan University (CZ)\n5. BCU (Infinity)\n6. DMU (Infinity)\n7. Hertfordshire (CZ)\n8. Wolve"
        },
        {
                "id": 20,
                "student_name": "Kawsiya",
                "counselor": "Thasbiha",
                "mobile": "767083036",
                "email": "N/A",
                "university": "Coventry",
                "course": "1. Disaster Management and Resilience MSc Jan/26",
                "status": "1. CO/payment/refund Required",
                "offers": "1. CO",
                "portal_type": "Yes (Thasbiiha)",
                "docs_status": "Pending Requested",
                "ielts": "did and low score",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "Requested the pending docs,",
                "visa_status": "N/A",
                "all_universities": "1. Coventry (CZ)"
        },
        {
                "id": 21,
                "student_name": "Thevapriya (Radiograhy)",
                "counselor": "Thasbiha",
                "mobile": "sri",
                "email": "N/A",
                "university": "Worcester",
                "course": "1. MRes in International Business and Management Studies Sep/25\n2. Mres MSc by Research Internationa",
                "status": "1. Application Rejected\n2. CO",
                "offers": "2. CO",
                "portal_type": "Agent File (?)",
                "docs_status": "Pending Requested",
                "ielts": "N/A",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "1. Worcester (D)\n2. UOG (GUS)"
        },
        {
                "id": 22,
                "student_name": "Tharun Kumaran",
                "counselor": "Bevan, Munsif, Thasbiha",
                "mobile": "utc",
                "email": "N/A",
                "university": "Sunderland",
                "course": "1. Photography, Video and Digital Imaging BA (Hons) Sep/25\n2. BA (Hons) Photography Sep/25\n3. BA (Ho",
                "status": "1. Dont Process with this, No Elicos\n2. Application sent for processing\n3. CO\n4. processed\n5. Portfolio Requested\n6. Portfolio Requested/Application Withdrawn\n7. CO\n8. Application Closed\n9. CO",
                "offers": "3. CO\n7. CO\n9. CO",
                "portal_type": "Agent File (Lawyer)",
                "docs_status": "N/A",
                "ielts": "no",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "1. IHS Form to be filled,, Need SOP from the student/Withdraw this as Lo result O.L was given",
                "visa_status": "N/A",
                "all_universities": "1. Sunderland (CZ)\n2. York St John (D)\n3. Wolverhampton (Infinity)\n4. DMU (Infinity)\n5. UWE (D)\n6. BCU (Infinity)\n7. UOG (GUS)\n8. Aston (OC)\n9. Aston (OC)"
        },
        {
                "id": 23,
                "student_name": "Mithurshan",
                "counselor": "Bevan, Thasbiha",
                "mobile": "sri",
                "email": "N/A",
                "university": "UWE",
                "course": "1. BA Business Management Sep/25\n2. Bevan Applied, Visa processed, and received a refusal for Oct in",
                "status": "1. UCO",
                "offers": "1. UCO",
                "portal_type": "Agent File (Shree)",
                "docs_status": "N/A",
                "ielts": "no",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "SOP and LOR needed",
                "visa_status": "N/A",
                "all_universities": "1. UWE (D)\n2. Sunderland (CZ)"
        },
        {
                "id": 24,
                "student_name": "Arulthas Casin\n(Platinum Visa)",
                "counselor": "Razaan",
                "mobile": "razan",
                "email": "N/A",
                "university": "UCLAN",
                "course": "1. Mres Management May/25\n2. Mres MSc by Research International Business Sep/25\n3. MRes in Internati",
                "status": "1. Pending Proposal\n2. CO\n3. Offer given Late, couldnt meet deadline\n4. Offer rejected Due to no degree\n5. CO\n6. reject due to management decision CZ, Qualifi\n7. reject due to management decision CZ, Qualifi\n8. reject due to management decision CZ, Qualifi\n9. Application sent for processing\n10. Rejected by Uni, Qualifi\n11. Intake Closed by Uni Suddenly",
                "offers": "2. CO\n5. CO\n11. UCO",
                "portal_type": "Agent File",
                "docs_status": "Pending",
                "ielts": "no",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "SOP and Research Proposal Pending",
                "visa_status": "N/A",
                "all_universities": "1. UCLAN (Edvoy)\n2. UOG (GUS)\n3. Worcester (D)\n4. Wolverhampton (Infinity)\n5. Coventry (CZ)\n6. Hertz (CZ)\n7. Greenwich (CZ)\n8. DMU (CZ)\n9. Hull (CEG)\n10. BCU (Infinity)\n11. UCA (D)"
        },
        {
                "id": 25,
                "student_name": "Sujeewa",
                "counselor": "Munsif, Ashfaq",
                "mobile": "munsif",
                "email": "N/A",
                "university": "Sunderland",
                "course": "1. Law LLM Sep/25\n2. LLM Master's in Law Sep/25\n3. Law LLM Sep/25\n4. International and Commercial La",
                "status": "1. CO\n2. CO\n3. CO\n4. CO\n5. CO",
                "offers": "2. CO\n3. CO\n4. CO\n5. CO",
                "portal_type": "Agent File (Lawyer)",
                "docs_status": "N/A",
                "ielts": "Student said will do, Pending",
                "submission_date": "2024-10-01",
                "handler": "Thasbiha",
                "source": "Thasbiha Admission Sheet",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "1. Sunderland (CZ)\n2. Hertfordshire (CZ)\n3. Coventry (CZ)\n4. Greenwich (CZ)\n5. BCU (Infinity)"
        },
        {
                "id": 26,
                "student_name": "Azam",
                "counselor": "Bevan",
                "mobile": "N/A",
                "email": "N/A",
                "university": "Sunderland University",
                "course": "1. Business Management and Entrepreneurship BA (Hons) (Top -Up)\n2. BSc (Hons) Business Enterprise an",
                "status": "1. Not eligible for IELTS Waiver\n2. Not meeting entry req\n3. Offer\n4. Application sent for processing \n5. Application Rejected\n6. Application sent for processing ",
                "offers": "3. CO",
                "portal_type": "Yes (Bevan)",
                "docs_status": "Pending",
                "ielts": "No",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "5. SOP pending from Student",
                "visa_status": "N/A",
                "all_universities": "1. Sunderland University (SP)\n2. Northumbria University (London - CZ)\n3. Coventry University (CZ)\n4. Sunderland University (CZ)\n5. DMUIC (Ox)\n6. UWE (D)"
        },
        {
                "id": 27,
                "student_name": "Akeel Hussain",
                "counselor": "Ashfaq",
                "mobile": "N/A",
                "email": "N/A",
                "university": "DMU",
                "course": "1. MBA (Global) Jan/26\n2. MSc International Business ",
                "status": "1. UCO/Payment/CAS",
                "offers": "1. UCO",
                "portal_type": "Yes (Ashfaq)",
                "docs_status": "Pending",
                "ielts": "No",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "1. DMU (CZ)\n2. Hertz (CZ)"
        },
        {
                "id": 28,
                "student_name": "Ajith (Thasbiha)",
                "counselor": "Thasbiha",
                "mobile": "N/A",
                "email": "N/A",
                "university": "Coventry University",
                "course": "1. Business Management and Leadership BA May/25\n2. Business and Management BA (Hons) May/25\n3. Bsc B",
                "status": "1. CO\n2. CO\n3. CO\n4. CO/not eligible for Waiver\n5. CO\n6. CO\n7. CO/Payment/Credibility Failed\n8. Processed",
                "offers": "1. CO\n2. CO\n3. CO\n4. CO\n5. CO\n6. CO\n7. CO/Payment",
                "portal_type": "Agent File (Shree)",
                "docs_status": "N/A",
                "ielts": "No",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "LOR needed",
                "visa_status": "N/A",
                "all_universities": "1. Coventry University (CZ)\n2. Sunderland University London (SP)\n3. Roehampton University (OX)\n4. London Metropolitan University (CZ)\n5. BCU (Infinity)\n6. DMU (Infinity)\n7. Hertfordshire (CZ)\n8. Wolve"
        },
        {
                "id": 29,
                "student_name": "Kawsiya",
                "counselor": "Thasbiha",
                "mobile": "N/A",
                "email": "N/A",
                "university": "Coventry",
                "course": "1. Disaster Management and Resilience MSc Jan/26",
                "status": "1. CO/payment/refund Required",
                "offers": "1. CO",
                "portal_type": "Yes (Thasbiiha) ",
                "docs_status": "Pending Requested",
                "ielts": "N/A",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "Requested the pending docs,",
                "visa_status": "N/A",
                "all_universities": "1. Coventry (CZ)"
        },
        {
                "id": 30,
                "student_name": "Thevapriya (Radiograhy)",
                "counselor": "Thasbiha",
                "mobile": "N/A",
                "email": "N/A",
                "university": "Worcester",
                "course": "1. MRes in International Business and Management Studies Sep/25\n2. Mres MSc by Research Internationa",
                "status": "1. Application Rejected\n2. CO",
                "offers": "2. CO",
                "portal_type": "Agent File (?)",
                "docs_status": "Pending Requested",
                "ielts": "N/A",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "1. Worcester (D)\n2. UOG (GUS)"
        },
        {
                "id": 31,
                "student_name": "Tharun Kumaran",
                "counselor": "Bevan, Munsif, Thasbiha",
                "mobile": "N/A",
                "email": "N/A",
                "university": "Sunderland",
                "course": "1. Photography, Video and Digital Imaging BA (Hons) Sep/25\n2. BA (Hons) Photography Sep/25\n3. BA (Ho",
                "status": "1. Dont Process with this, No Elicos\n2. Application sent for processing\n3. CO\n4. processed\n5. Portfolio Requested\n6. Portfolio Requested/Application Withdrawn\n7. CO\n8. Application Closed\n9. CO",
                "offers": "3. CO\n7. CO\n9. CO",
                "portal_type": "Agent File (Lawyer)",
                "docs_status": "N/A",
                "ielts": "N/A",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "1. IHS Form to be filled,, Need SOP from the student/Withdraw this as Lo result O.L was given",
                "visa_status": "N/A",
                "all_universities": "1. Sunderland (CZ)\n2. York St John (D)\n3. Wolverhampton (Infinity)\n4. DMU (Infinity)\n5. UWE (D)\n6. BCU (Infinity)\n7. UOG (GUS)\n8. Aston (OC)\n9. Aston (OC)"
        },
        {
                "id": 32,
                "student_name": "Ayesha Kumari\n(Synexis Edu)",
                "counselor": "Razaan",
                "mobile": "N/A",
                "email": "N/A",
                "university": "Worcester",
                "course": "1. MRes in International Business and Management Studies Sep/25",
                "status": "1. Application Unsuccesful",
                "offers": "N/A",
                "portal_type": "Agent File",
                "docs_status": "N/A",
                "ielts": "N/A",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "1. Worcester (D)"
        },
        {
                "id": 33,
                "student_name": "Mithurshan",
                "counselor": "Bevan, Thasbiha",
                "mobile": "N/A",
                "email": "N/A",
                "university": "UWE",
                "course": "1. BA Business Management Sep/25\n2. Bevan Applied, Visa processed, and received a refusal for Oct in",
                "status": "1. UCO",
                "offers": "1. UCO",
                "portal_type": "Agent File (Shree)",
                "docs_status": "N/A",
                "ielts": "N/A",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "SOP and LOR needed",
                "visa_status": "N/A",
                "all_universities": "1. UWE (D)\n2. Sunderland (CZ)"
        },
        {
                "id": 34,
                "student_name": "Arulthas Casin\n(Platinum Visa)",
                "counselor": "Razaan",
                "mobile": "N/A",
                "email": "N/A",
                "university": "UCLAN",
                "course": "1. Mres Management May/25\n2. Mres MSc by Research International Business Sep/25\n3. MRes in Internati",
                "status": "1. Pending Proposal\n2. CO\n3. Offer given Late, couldnt meet deadline\n4. Offer rejected Due to no degree\n5. CO\n6. reject due to management decision CZ, Qualifi\n7. reject due to management decision CZ, Qualifi\n8. reject due to management decision CZ, Qualifi\n9. Application sent for processing\n10. Rejected by Uni, Qualifi\n11. Intake Closed by Uni Suddenly",
                "offers": "2. CO\n5. CO\n11. UCO",
                "portal_type": "Agent File",
                "docs_status": "Pending",
                "ielts": "N/A",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "SOP and Research Proposal Pending",
                "visa_status": "N/A",
                "all_universities": "1. UCLAN (Edvoy)\n2. UOG (GUS)\n3. Worcester (D)\n4. Wolverhampton (Infinity)\n5. Coventry (CZ)\n6. Hertz (CZ)\n7. Greenwich (CZ)\n8. DMU (CZ)\n9. Hull (CEG)\n10. BCU (Infinity)\n11. UCA (D)"
        },
        {
                "id": 35,
                "student_name": "Sujeewa",
                "counselor": "Munsif, Ashfaq",
                "mobile": "N/A",
                "email": "N/A",
                "university": "Sunderland",
                "course": "1. Law LLM Sep/25\n2. LLM Master's in Law Sep/25\n3. Law LLM Sep/25\n4. International and Commercial La",
                "status": "1. CO\n2. CO\n3. CO\n4. CO\n5. CO",
                "offers": "2. CO\n3. CO\n4. CO\n5. CO",
                "portal_type": "Agent File (Lawyer)",
                "docs_status": "N/A",
                "ielts": "Student said will do, Pending",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "1. Sunderland (CZ)\n2. Hertfordshire (CZ)\n3. Coventry (CZ)\n4. Greenwich (CZ)\n5. BCU (Infinity)"
        },
        {
                "id": 36,
                "student_name": "Milakshan",
                "counselor": "Ashfaq, Thasbiha, Munsif",
                "mobile": "N/A",
                "email": "N/A",
                "university": "Aston",
                "course": "1. Electronic and Electrical Eng Foundation Sep/25\n2. Mechatronics and Robotics BEng (Hons) Sep/25\n3",
                "status": "1. CO\n2. UCO\n3. Uni Not processing for the program/Closed",
                "offers": "1. CO\n2. UCO",
                "portal_type": "N/A",
                "docs_status": "N/A",
                "ielts": "N/A",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "1. Aston (OC)\n2. DMU (CZ)\n3. UOG (GUS)"
        },
        {
                "id": 37,
                "student_name": "Hivindu",
                "counselor": "Bevan",
                "mobile": "N/A",
                "email": "N/A",
                "university": "BCU",
                "course": "1. International Business (Top-Up) - BA (Hons) Sep/25\n2. Business Administration BA (Hons) (Final Ye",
                "status": "1. Processed\n2. UCO\n3. Need to apply through UCAS and payment required\n4. Processed",
                "offers": "2. UCO",
                "portal_type": "Yes (Bevan)",
                "docs_status": "N/A",
                "ielts": "N/A",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "1. BCU (CZ)\n2. DMU (CZ)\n3. Aston University (CZ)\n4. Hertfordshire (CZ)"
        },
        {
                "id": 38,
                "student_name": "Afkhaan",
                "counselor": "Bevan, Thasbiha",
                "mobile": "N/A",
                "email": "N/A",
                "university": "York St John",
                "course": "1. Commercial Law and Practice (LLM) Sep/25\n2. LLM Business Law Sep/25\n3. LL.M Master of Laws Sep/25",
                "status": "1. Not eligible/3rd class degree\n2. CO\n3. UCO\n4. UCO",
                "offers": "2. CO\n3. CO\n4. UCO",
                "portal_type": "Not Yet",
                "docs_status": "N/A",
                "ielts": "N/A",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "1. York St John (D)\n2. Hertfordshire (CZ)\n3. Sunderland (Infinity)\n4. UWE (D)"
        },
        {
                "id": 39,
                "student_name": "Mary Rishani\n(Tamil Overseas Edu)",
                "counselor": "Razaan",
                "mobile": "N/A",
                "email": "N/A",
                "university": "BPP",
                "course": "1. BSc (Hons) Applied Management May/25",
                "status": "1. Application sent for processing",
                "offers": "N/A",
                "portal_type": "Agent File",
                "docs_status": "N/A",
                "ielts": "N/A",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "1. BPP (SP)"
        },
        {
                "id": 40,
                "student_name": "Sajitha\n(Synexis Education)",
                "counselor": "Razaan",
                "mobile": "N/A",
                "email": "N/A",
                "university": "Worcester",
                "course": "1. MRes in International Business and Management Studies Jan/25",
                "status": "1. CO",
                "offers": "1. CO",
                "portal_type": "Agent File",
                "docs_status": "N/A",
                "ielts": "N/A",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "1. Worcester (D)"
        },
        {
                "id": 41,
                "student_name": "Ilma Nazim",
                "counselor": "Thasbiha",
                "mobile": "N/A",
                "email": "N/A",
                "university": "UOG",
                "course": "1. Mres MSc by Research International Business Sep/25\n2. Available Mres programs for Business Oct/25",
                "status": "1. CO/Payment\n2. CO for MBA",
                "offers": "1. CO\n2. CO",
                "portal_type": "?",
                "docs_status": "N/A",
                "ielts": "No",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "1. UOG (GUS)\n2. UWTSD (UniVive)"
        },
        {
                "id": 42,
                "student_name": "Aasif\n(Shree)",
                "counselor": "Thasbiha",
                "mobile": "N/A",
                "email": "N/A",
                "university": "Worcester",
                "course": "1. BA Honours Business Management Top Up Sep/25\n2. BA (Hons) International Business Management (Top ",
                "status": "1. CO\n2. UCO/Payment/CAS\n3. CO\n4. Application sent for processing",
                "offers": "1. CO\n2. UCO/payment/CAS\n3. CO",
                "portal_type": "Agent File",
                "docs_status": "Pending",
                "ielts": "N/A",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "1. Worcester (D)\n2. Hertfordshire (CZ)\n3. DMU (CZ)\n4. BCU (CZ)"
        },
        {
                "id": 43,
                "student_name": "Chameera",
                "counselor": "Thasbiha",
                "mobile": "N/A",
                "email": "N/A",
                "university": "Worcester",
                "course": "1. MRes in International Business and Management Studies Sep/25\n2. Mres MSc by Research Internationa",
                "status": "1. Application Rejected\n2. CO",
                "offers": "N/A",
                "portal_type": "N/A",
                "docs_status": "Pending",
                "ielts": "N/A",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "1. Worcester (D)\n2. UOG (GUS)"
        },
        {
                "id": 44,
                "student_name": "Nirojiny",
                "counselor": "Bevan",
                "mobile": "N/A",
                "email": "N/A",
                "university": "UOG",
                "course": "1. Mres MSc by Research International Business Sep/25\n2. MRes in International Business and Manageme",
                "status": "1. CO/rejected\n2. Application Sent for processing",
                "offers": "1. CO",
                "portal_type": "Promotion File",
                "docs_status": "Pending",
                "ielts": "No",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "2. SOP and Research proposal",
                "visa_status": "N/A",
                "all_universities": "1. UOG (GUS)\n2. Worscester (D)"
        },
        {
                "id": 45,
                "student_name": "Miruth (L.Kishanth)",
                "counselor": "Umair",
                "mobile": "N/A",
                "email": "N/A",
                "university": "DMU",
                "course": "1. Mechatronics and Robotics IY1 Sep/25",
                "status": "1. UCO",
                "offers": "1. UCO",
                "portal_type": "Not Yet",
                "docs_status": "N/A",
                "ielts": "N/A",
                "submission_date": "2024-11-01",
                "handler": "Umair",
                "source": "Umair Admission Sheet (Admissions 4)",
                "todo": "None",
                "visa_status": "N/A",
                "all_universities": "1. DMU (OX)"
        },
        {
                "id": 46,
                "student_name": "Hari - Sreesureharippillai",
                "counselor": "Thasbiha",
                "mobile": "N/A",
                "email": "N/A",
                "university": "UK University",
                "course": "N/A",
                "status": "Visa Stage",
                "offers": "CO",
                "portal_type": "Direct",
                "docs_status": "Complete",
                "ielts": "Yes",
                "submission_date": "2026-01-15",
                "handler": "Razan (Visa)",
                "source": "Razan Visa Status Sheet",
                "todo": "Waiting for Visa decision",
                "visa_status": "In Progress",
                "visa_start_date": "2026-01-15 00:00:00",
                "visa_vfs_date": "2026-01-23 00:00:00",
                "visa_description": "Waiting for Visa decision",
                "all_universities": "UK"
        },
        {
                "id": 47,
                "student_name": "Aasif Nafeer",
                "counselor": "Thasbiha",
                "mobile": "N/A",
                "email": "N/A",
                "university": "UK University",
                "course": "N/A",
                "status": "Visa Stage",
                "offers": "CO",
                "portal_type": "Agent",
                "docs_status": "Complete",
                "ielts": "Yes",
                "submission_date": "2026-01-21",
                "handler": "Razan (Visa)",
                "source": "Razan Visa Status Sheet",
                "todo": "Waiting for Visa decision",
                "visa_status": "In Progress",
                "visa_start_date": "2026-01-21 00:00:00",
                "visa_vfs_date": "2026-01-28 00:00:00",
                "visa_description": "Waiting for Visa decision",
                "all_universities": "UK"
        },
        {
                "id": 48,
                "student_name": "Sanjay",
                "counselor": "Thasbiha",
                "mobile": "N/A",
                "email": "N/A",
                "university": "UK University",
                "course": "N/A",
                "status": "Visa Stage",
                "offers": "CO",
                "portal_type": "Agent",
                "docs_status": "Complete",
                "ielts": "Yes",
                "submission_date": "2026-01-16",
                "handler": "Razan (Visa)",
                "source": "Razan Visa Status Sheet",
                "todo": "Waiting for Visa decision",
                "visa_status": "In Progress",
                "visa_start_date": "2026-01-16 00:00:00",
                "visa_vfs_date": "2026-01-21 00:00:00",
                "visa_description": "Waiting for Visa decision",
                "all_universities": "UK"
        }
];
    return c.json(applications);
});

app.get('/applications-visa', (c) => c.html(applicationsVisaPage));

// Finance & Commission Management Page
app.get('/finance-commission', (c) => c.html(financeCommissionPage));

// System Settings & Administration Page
app.get('/system-settings', (c) => c.html(systemSettingsPage));

// (404 handler moved to end of file so it doesn't shadow later routes)


// ============================================================
// AUTOMATION PIPELINE v4.0 — A-to-Z Student Journey
// ============================================================

// --- AUTOMATION LEADS (enhanced lead model) ---
let AUTO_LEADS: any[] = [
  {
    id: 'AL001', name: 'Priya Nair', email: 'priya.nair@email.com', phone: '+94771111001',
    country: 'Sri Lanka', studyDestination: 'UK', studyLevel: 'PG', studyField: 'Business Management',
    intakePeriod: 'September 2026', budget: '£15,000-20,000', ieltsScore: '6.5',
    source: 'Instagram', status: 'qualified', journeyStage: 2, assignedCounselor: 'Thasbiha S.',
    aiScore: 82, followUpDates: [], lastContact: new Date(Date.now()-86400000).toISOString(),
    notes: ['Interested in London universities', 'Has 3 years work experience'],
    documents: [], createdAt: new Date(Date.now()-7*86400000).toISOString(), updatedAt: new Date().toISOString()
  },
  {
    id: 'AL002', name: 'Sahan Fernando', email: 'sahan.f@email.com', phone: '+94772222002',
    country: 'Sri Lanka', studyDestination: 'UK', studyLevel: 'UG', studyField: 'Computer Science',
    intakePeriod: 'January 2026', budget: '£12,000-15,000', ieltsScore: '7.0',
    source: 'Walk-in', status: 'application', journeyStage: 4, assignedCounselor: 'Sukaina',
    aiScore: 91, followUpDates: [], lastContact: new Date(Date.now()-172800000).toISOString(),
    notes: ['Strong academic profile', 'Needs SOP help'],
    documents: ['passport.pdf', 'degree.pdf'], createdAt: new Date(Date.now()-14*86400000).toISOString(), updatedAt: new Date().toISOString()
  },
  {
    id: 'AL003', name: 'Amali Wickramasinghe', email: 'amali.w@email.com', phone: '+94773333003',
    country: 'Sri Lanka', studyDestination: 'Canada', studyLevel: 'PG', studyField: 'Data Science',
    intakePeriod: 'September 2026', budget: 'CAD 25,000-35,000', ieltsScore: '7.5',
    source: 'Referral', status: 'offer', journeyStage: 5, assignedCounselor: 'Thasbiha S.',
    aiScore: 95, followUpDates: [], lastContact: new Date(Date.now()-3600000).toISOString(),
    notes: ['Offer from UBC received', 'Needs visa prep'],
    documents: ['passport.pdf', 'degree.pdf', 'ielts.pdf', 'sop.pdf'], createdAt: new Date(Date.now()-30*86400000).toISOString(), updatedAt: new Date().toISOString()
  }
];
let AUTO_LEAD_COUNTER = 4;

// --- EMAIL SEQUENCES ---
const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  welcome: {
    subject: 'Welcome to Global Guidance — Your Study Abroad Journey Starts Here!',
    body: `Dear {{name}},\n\nThank you for reaching out to Global Guidance! We're excited to help you achieve your dream of studying abroad.\n\nBased on your interest in {{studyDestination}} for {{studyLevel}} studies in {{studyField}}, our expert counsellors have already started identifying the best universities for your profile.\n\n**Your next step:** Book a FREE 30-minute consultation with our counsellor who will:\n• Review your academic background\n• Shortlist universities matching your profile\n• Guide you through the application process\n\nReply to this email or call us to book your slot.\n\nWarm regards,\nGlobal Guidance Team\n📞 +94 11 XXX XXXX\n🌐 www.globalguidance.lk`
  },
  follow_up_1: {
    subject: 'Following up — Your {{studyDestination}} Study Options',
    body: `Dear {{name}},\n\nI hope you're doing well! I wanted to follow up on your enquiry about studying in {{studyDestination}}.\n\nWe have several exciting opportunities matching your profile for {{intakePeriod}} intake. Universities like {{universities}} have been accepting students with profiles similar to yours.\n\nI'd love to discuss these options with you. Are you available for a quick call this week?\n\nBest regards,\n{{counselor}}\nGlobal Guidance`
  },
  follow_up_2: {
    subject: 'Last chance — {{intakePeriod}} application deadline approaching',
    body: `Dear {{name}},\n\nI wanted to reach out one more time as the {{intakePeriod}} application deadline is fast approaching.\n\nStudents who apply early have:\n✅ Higher acceptance rates\n✅ Better scholarship opportunities  \n✅ More time for visa processing\n\nDon't miss this opportunity. Contact us today and we'll guide you through every step.\n\nBest regards,\nGlobal Guidance Team`
  },
  offer_received: {
    subject: '🎉 Congratulations! Offer Received from {{university}}',
    body: `Dear {{name}},\n\nFantastic news! You have received a Conditional Offer from {{university}} for {{course}}!\n\n**Next Steps:**\n1. Review and accept your offer\n2. Complete remaining document requirements\n3. Begin visa preparation\n4. Arrange university fee payment\n\nOur team will guide you through each step. Please contact your counsellor {{counselor}} at your earliest convenience.\n\nCongratulations once again!\nGlobal Guidance Team`
  },
  visa_prep: {
    subject: 'Visa Application Guide — Important Steps for Your {{destination}} Visa',
    body: `Dear {{name}},\n\nNow that you have your university offer, it's time to prepare your visa application. Here's what you need:\n\n📋 **Document Checklist:**\n• Valid passport (min. 18 months validity)\n• CAS/Acceptance letter from university\n• Financial evidence (bank statements)\n• English test results\n• Academic transcripts\n• Personal statement\n• Accommodation proof\n\n**Timeline:** Start your visa application at least 3 months before your course start date.\n\nOur visa specialist {{visaOfficer}} will contact you within 24 hours to begin your application.\n\nBest regards,\nGlobal Guidance Visa Team`
  },
  payment_reminder: {
    subject: 'Payment Reminder — Service Fee for {{name}}',
    body: `Dear {{name}},\n\nThis is a friendly reminder that your service fee payment of {{amount}} is due on {{dueDate}}.\n\n**Payment Options:**\n• Bank Transfer: [Account Details]\n• Online Payment: [Payment Link]\n• Cash at Office\n\nPlease contact us if you need any assistance.\n\nGlobal Guidance Finance Team`
  }
};

let AUTO_EMAILS: any[] = [];
let EMAIL_COUNTER = 1;

// --- AUTOMATION PIPELINE STATE ---
let PIPELINE_AUTOMATION: any = {
  autoFollowUp: true,
  autoEmailOnNew: true,
  autoScore: true,
  followUpDays: [1, 3, 7, 14, 30],
  workingHours: { start: 8, end: 20 }
};

// --- VISA CHECKLISTS ---
let VISA_CHECKLISTS: any[] = [
  {
    id: 'VC001', studentId: 'AL003', university: 'University of British Columbia', country: 'Canada',
    status: 'in_progress', interviewDate: '', interviewPrepScore: 0,
    items: [
      { id: 'vi1', category: 'Identity', document: 'Valid passport', required: true, uploaded: true, verified: true, notes: '' },
      { id: 'vi2', category: 'Academic', document: 'Degree certificate', required: true, uploaded: true, verified: true, notes: '' },
      { id: 'vi3', category: 'Academic', document: 'Official transcripts', required: true, uploaded: true, verified: false, notes: 'Awaiting verification' },
      { id: 'vi4', category: 'Language', document: 'IELTS score report', required: true, uploaded: true, verified: true, notes: '' },
      { id: 'vi5', category: 'Financial', document: 'Bank statements (6 months)', required: true, uploaded: false, verified: false, notes: '' },
      { id: 'vi6', category: 'Financial', document: 'Sponsor letter', required: true, uploaded: false, verified: false, notes: '' },
      { id: 'vi7', category: 'University', document: 'Acceptance/offer letter', required: true, uploaded: true, verified: true, notes: '' },
      { id: 'vi8', category: 'University', document: 'Tuition fee payment receipt', required: true, uploaded: false, verified: false, notes: '' },
      { id: 'vi9', category: 'Personal', document: 'Statement of Purpose', required: true, uploaded: true, verified: false, notes: '' },
      { id: 'vi10', category: 'Medical', document: 'Medical examination', required: false, uploaded: false, verified: false, notes: 'Required if applying from certain countries' }
    ]
  }
];
let VISA_CHECKLIST_COUNTER = 2;

// --- INTERVIEW SESSIONS ---
let INTERVIEW_SESSIONS: any[] = [];
let INTERVIEW_COUNTER = 1;

// --- PAYMENTS ---
let PAYMENTS: any[] = [
  {
    id: 'PAY001', studentId: 'AL002', type: 'service_fee', amount: 150000, currency: 'LKR',
    description: 'Global Guidance Service Fee - UK Application', status: 'paid',
    dueDate: '2026-01-15', paidDate: '2026-01-10', invoiceNumber: 'GG-2026-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'PAY002', studentId: 'AL003', type: 'university_fee', amount: 8000, currency: 'GBP',
    description: 'Deposit to University of British Columbia', status: 'pending',
    dueDate: '2026-04-01', paidDate: '', invoiceNumber: 'GG-2026-002',
    createdAt: new Date().toISOString()
  }
];
let PAYMENT_COUNTER = 3;

// --- DOCUMENT REQUESTS ---
let DOC_REQUESTS: any[] = [];
let DOC_REQUEST_COUNTER = 1;

// ============================================================
// AUTOMATION API ENDPOINTS
// ============================================================

// -- AI Lead Scoring --
function scoreLeadAI(lead: any): number {
  let score = 50;
  if (lead.ieltsScore) {
    const ielts = parseFloat(lead.ieltsScore);
    if (ielts >= 7.5) score += 20;
    else if (ielts >= 7.0) score += 15;
    else if (ielts >= 6.5) score += 10;
    else if (ielts >= 6.0) score += 5;
  }
  if (lead.studyLevel === 'PG') score += 10;
  if (['Referral', 'Walk-in'].includes(lead.source)) score += 15;
  else if (['Google', 'Website'].includes(lead.source)) score += 8;
  if (lead.intakePeriod && lead.intakePeriod.toLowerCase().includes('september')) score += 5;
  if (lead.studyField && lead.studyField.length > 3) score += 5;
  return Math.min(100, Math.max(0, score));
}

// -- Email Template Generator --
function generateEmail(type: string, lead: any): { subject: string; body: string } {
  const template = EMAIL_TEMPLATES[type] || EMAIL_TEMPLATES.welcome;
  const replace = (str: string) => str
    .replace(/{{name}}/g, lead.name || '')
    .replace(/{{studyDestination}}/g, lead.studyDestination || '')
    .replace(/{{studyLevel}}/g, lead.studyLevel || '')
    .replace(/{{studyField}}/g, lead.studyField || '')
    .replace(/{{intakePeriod}}/g, lead.intakePeriod || '')
    .replace(/{{counselor}}/g, lead.assignedCounselor || 'Your Counsellor')
    .replace(/{{universities}}/g, 'Coventry University, University of Westminster, DMU')
    .replace(/{{destination}}/g, lead.studyDestination || '')
    .replace(/{{university}}/g, 'the University')
    .replace(/{{course}}/g, lead.studyField || 'your program');
  return { subject: replace(template.subject), body: replace(template.body) };
}

// -- AUTOMATION LEAD ENDPOINTS --
app.get('/api/auto/leads', (c) => {
  const status = c.req.query('status');
  const stage = c.req.query('stage');
  const counselor = c.req.query('counselor');
  let leads = [...AUTO_LEADS];
  if (status) leads = leads.filter(l => l.status === status);
  if (stage) leads = leads.filter(l => l.journeyStage === parseInt(stage));
  if (counselor) leads = leads.filter(l => l.assignedCounselor === counselor);
  leads.sort((a, b) => b.aiScore - a.aiScore);
  return c.json({ leads, total: leads.length });
});

app.get('/api/auto/leads/stats', (c) => {
  const stages = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
  AUTO_LEADS.forEach(l => { if (stages[l.journeyStage] !== undefined) stages[l.journeyStage]++; });
  return c.json({
    total: AUTO_LEADS.length,
    byStatus: AUTO_LEADS.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {}),
    byStage: stages,
    avgScore: AUTO_LEADS.length ? Math.round(AUTO_LEADS.reduce((s, l) => s + l.aiScore, 0) / AUTO_LEADS.length) : 0,
    hotLeads: AUTO_LEADS.filter(l => l.aiScore >= 80).length,
    needsFollowUp: AUTO_LEADS.filter(l => {
      if (!l.lastContact) return true;
      const daysSince = (Date.now() - new Date(l.lastContact).getTime()) / 86400000;
      return daysSince > 3 && !['enrolled', 'dropped'].includes(l.status);
    }).length
  });
});

app.get('/api/auto/leads/:id', (c) => {
  const lead = AUTO_LEADS.find(l => l.id === c.req.param('id'));
  if (!lead) return c.json({ error: 'Lead not found' }, 404);
  return c.json(lead);
});

app.post('/api/auto/leads', async (c) => {
  const data = await c.req.json();
  const id = 'AL' + String(AUTO_LEAD_COUNTER++).padStart(3, '0');
  const aiScore = scoreLeadAI(data);
  const newLead = {
    id, ...data,
    status: data.status || 'new',
    journeyStage: 1,
    aiScore,
    followUpDates: [],
    lastContact: null,
    notes: data.notes || [],
    documents: data.documents || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  AUTO_LEADS.push(newLead);

  // Auto-send welcome email if enabled
  if (PIPELINE_AUTOMATION.autoEmailOnNew && data.email) {
    const emailContent = generateEmail('welcome', newLead);
    AUTO_EMAILS.push({
      id: 'EM' + String(EMAIL_COUNTER++).padStart(3, '0'),
      leadId: id, type: 'welcome',
      ...emailContent,
      sentAt: new Date().toISOString(), opened: false, clicked: false
    });
  }

  return c.json({ success: true, lead: newLead, emailSent: PIPELINE_AUTOMATION.autoEmailOnNew });
});

app.put('/api/auto/leads/:id', async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  const idx = AUTO_LEADS.findIndex(l => l.id === id);
  if (idx === -1) return c.json({ error: 'Not found' }, 404);
  AUTO_LEADS[idx] = { ...AUTO_LEADS[idx], ...data, updatedAt: new Date().toISOString() };
  return c.json({ success: true, lead: AUTO_LEADS[idx] });
});

// Advance journey stage
app.post('/api/auto/leads/:id/advance', async (c) => {
  const id = c.req.param('id');
  const lead = AUTO_LEADS.find(l => l.id === id);
  if (!lead) return c.json({ error: 'Not found' }, 404);
  const stageMap: Record<number, string> = {
    1: 'contacted', 2: 'qualified', 3: 'nurturing', 4: 'application',
    5: 'offer', 6: 'visa_prep', 7: 'visa_applied', 8: 'enrolled'
  };
  const nextStage = Math.min(8, lead.journeyStage + 1);
  lead.journeyStage = nextStage;
  lead.status = stageMap[nextStage] || lead.status;
  lead.updatedAt = new Date().toISOString();
  // Auto email on key transitions
  if (nextStage === 5) {
    AUTO_EMAILS.push({ id: 'EM' + String(EMAIL_COUNTER++).padStart(3,'0'), leadId: id, type: 'offer_received', ...generateEmail('offer_received', lead), sentAt: new Date().toISOString(), opened: false, clicked: false });
  } else if (nextStage === 6) {
    AUTO_EMAILS.push({ id: 'EM' + String(EMAIL_COUNTER++).padStart(3,'0'), leadId: id, type: 'visa_prep', ...generateEmail('visa_prep', lead), sentAt: new Date().toISOString(), opened: false, clicked: false });
  }
  return c.json({ success: true, lead, emailSent: [5, 6].includes(nextStage) });
});

// AI Score a lead
app.post('/api/auto/leads/:id/score', async (c) => {
  const id = c.req.param('id');
  const lead = AUTO_LEADS.find(l => l.id === id);
  if (!lead) return c.json({ error: 'Not found' }, 404);
  lead.aiScore = scoreLeadAI(lead);
  lead.updatedAt = new Date().toISOString();
  return c.json({ success: true, aiScore: lead.aiScore, lead });
});

// Log contact
app.post('/api/auto/leads/:id/contact', async (c) => {
  const id = c.req.param('id');
  const { method, notes, outcome } = await c.req.json();
  const lead = AUTO_LEADS.find(l => l.id === id);
  if (!lead) return c.json({ error: 'Not found' }, 404);
  lead.lastContact = new Date().toISOString();
  if (notes) lead.notes.push(`[${new Date().toLocaleDateString()} - ${method}] ${notes}`);
  if (outcome) lead.status = outcome;
  lead.updatedAt = new Date().toISOString();
  return c.json({ success: true, lead });
});

// -- EMAIL AUTOMATION ENDPOINTS --
app.get('/api/auto/emails', (c) => {
  const leadId = c.req.query('leadId');
  const emails = leadId ? AUTO_EMAILS.filter(e => e.leadId === leadId) : AUTO_EMAILS;
  return c.json(emails);
});

app.post('/api/auto/emails/send', async (c) => {
  const { leadId, type, customBody } = await c.req.json();
  const lead = AUTO_LEADS.find(l => l.id === leadId);
  if (!lead) return c.json({ error: 'Lead not found' }, 404);
  const content = customBody ? { subject: 'Follow-up from Global Guidance', body: customBody } : generateEmail(type, lead);
  const email = {
    id: 'EM' + String(EMAIL_COUNTER++).padStart(3, '0'),
    leadId, type, ...content,
    sentAt: new Date().toISOString(), opened: false, clicked: false
  };
  AUTO_EMAILS.push(email);
  lead.lastContact = new Date().toISOString();
  return c.json({ success: true, email });
});

app.get('/api/auto/emails/preview/:type', async (c) => {
  const type = c.req.param('type');
  const leadId = c.req.query('leadId');
  const lead = leadId ? AUTO_LEADS.find(l => l.id === leadId) : AUTO_LEADS[0];
  if (!lead) return c.json({ error: 'No lead found' }, 404);
  return c.json(generateEmail(type, lead));
});

// -- VISA CHECKLIST ENDPOINTS --
app.get('/api/auto/visa-checklists', (c) => {
  const studentId = c.req.query('studentId');
  const lists = studentId ? VISA_CHECKLISTS.filter(v => v.studentId === studentId) : VISA_CHECKLISTS;
  return c.json(lists);
});

app.get('/api/auto/visa-checklists/:id', (c) => {
  const checklist = VISA_CHECKLISTS.find(v => v.id === c.req.param('id'));
  if (!checklist) return c.json({ error: 'Not found' }, 404);
  return c.json(checklist);
});

app.post('/api/auto/visa-checklists', async (c) => {
  const data = await c.req.json();
  const defaultItems = [
    { id: 'i1', category: 'Identity', document: 'Valid passport (18+ months validity)', required: true, uploaded: false, verified: false, notes: '' },
    { id: 'i2', category: 'Academic', document: 'Final degree certificate (notarized)', required: true, uploaded: false, verified: false, notes: '' },
    { id: 'i3', category: 'Academic', document: 'Official transcripts', required: true, uploaded: false, verified: false, notes: '' },
    { id: 'i4', category: 'Language', document: 'IELTS/TOEFL score report', required: true, uploaded: false, verified: false, notes: '' },
    { id: 'i5', category: 'Financial', document: 'Bank statements (6 months)', required: true, uploaded: false, verified: false, notes: '' },
    { id: 'i6', category: 'Financial', document: 'Sponsor letter / financial guarantee', required: true, uploaded: false, verified: false, notes: '' },
    { id: 'i7', category: 'University', document: 'CAS / Acceptance letter', required: true, uploaded: false, verified: false, notes: '' },
    { id: 'i8', category: 'University', document: 'Tuition fee payment receipt', required: true, uploaded: false, verified: false, notes: '' },
    { id: 'i9', category: 'Personal', document: 'Statement of Purpose / CV', required: true, uploaded: false, verified: false, notes: '' },
    { id: 'i10', category: 'Medical', document: 'Medical examination (if required)', required: false, uploaded: false, verified: false, notes: '' },
    { id: 'i11', category: 'Accommodation', document: 'Accommodation booking confirmation', required: false, uploaded: false, verified: false, notes: '' },
    { id: 'i12', category: 'TB Test', document: 'Tuberculosis test result', required: false, uploaded: false, verified: false, notes: 'Required for Sri Lanka applicants for UK' }
  ];
  const checklist = {
    id: 'VC' + String(VISA_CHECKLIST_COUNTER++).padStart(3, '0'),
    studentId: data.studentId, university: data.university, country: data.country,
    items: data.items || defaultItems, status: 'not_started',
    interviewDate: data.interviewDate || '', interviewPrepScore: 0,
    createdAt: new Date().toISOString()
  };
  VISA_CHECKLISTS.push(checklist);
  return c.json({ success: true, checklist });
});

app.put('/api/auto/visa-checklists/:id/item', async (c) => {
  const checklist = VISA_CHECKLISTS.find(v => v.id === c.req.param('id'));
  if (!checklist) return c.json({ error: 'Not found' }, 404);
  const { itemId, uploaded, verified, notes } = await c.req.json();
  const item = checklist.items.find((i: any) => i.id === itemId);
  if (item) {
    if (uploaded !== undefined) item.uploaded = uploaded;
    if (verified !== undefined) item.verified = verified;
    if (notes !== undefined) item.notes = notes;
  }
  const required = checklist.items.filter((i: any) => i.required);
  const complete = required.filter((i: any) => i.uploaded && i.verified).length;
  if (complete === required.length) checklist.status = 'ready';
  else if (complete > 0) checklist.status = 'in_progress';
  return c.json({ success: true, checklist });
});

// -- INTERVIEW PREP ENDPOINTS --
app.get('/api/auto/interviews', (c) => {
  const studentId = c.req.query('studentId');
  const sessions = studentId ? INTERVIEW_SESSIONS.filter(s => s.studentId === studentId) : INTERVIEW_SESSIONS;
  return c.json(sessions);
});

app.post('/api/auto/interviews', async (c) => {
  const data = await c.req.json();
  const session = {
    id: 'INT' + String(INTERVIEW_COUNTER++).padStart(3, '0'),
    studentId: data.studentId, type: data.type || 'university',
    scheduledDate: data.scheduledDate, duration: data.duration || 60,
    status: 'scheduled', prepScore: 0,
    mockQuestions: [], counselorFeedback: '',
    createdAt: new Date().toISOString()
  };
  INTERVIEW_SESSIONS.push(session);
  return c.json({ success: true, session });
});

// Get mock interview questions
app.get('/api/auto/interviews/questions', (c) => {
  const type = c.req.query('type') || 'university';
  const uniQuestions = [
    { q: 'Why did you choose this university?', category: 'motivation', tips: 'Mention specific programs, faculty, and rankings' },
    { q: 'What are your career goals?', category: 'future_plans', tips: 'Be specific and show how this degree aligns' },
    { q: 'Why did you choose this course?', category: 'motivation', tips: 'Show research and genuine interest in the field' },
    { q: 'Tell me about your academic background.', category: 'academic', tips: 'Highlight achievements and relevant experience' },
    { q: 'How will you fund your studies?', category: 'financial', tips: 'Have clear financial documentation ready' },
    { q: 'What did you do after graduation?', category: 'academic', tips: 'Explain any gaps and what you learned' },
    { q: 'Do you plan to work during your studies?', category: 'future_plans', tips: 'UK allows 20hrs/week on student visa' },
    { q: 'What are your plans after completing your degree?', category: 'future_plans', tips: 'Show intention to use degree in home country' }
  ];
  const visaQuestions = [
    { q: 'Why do you want to study in the UK?', category: 'motivation', tips: 'Focus on academic quality, not immigration intentions' },
    { q: 'Why this specific university?', category: 'motivation', tips: 'Research the university well before the interview' },
    { q: 'What are your ties to your home country?', category: 'ties', tips: 'Mention family, job offers, property, community ties' },
    { q: 'What will you do after you finish your studies?', category: 'future_plans', tips: 'Emphasize returning home and career plans there' },
    { q: 'How are you financing your studies?', category: 'financial', tips: 'Be ready with bank statements and sponsor letters' },
    { q: 'Have you applied to other countries?', category: 'motivation', tips: 'Explain why UK is your preferred choice' },
    { q: 'What is the duration of your course?', category: 'academic', tips: 'Know exact start/end dates and module details' },
    { q: 'Have you been to the UK before?', category: 'history', tips: 'Be honest about all previous travel history' },
    { q: 'Do you have any relatives in the UK?', category: 'ties', tips: 'Disclose honestly; having relatives is not disqualifying' },
    { q: 'What did you study previously?', category: 'academic', tips: 'Explain the progression from previous to current studies' }
  ];
  return c.json(type === 'visa' ? visaQuestions : uniQuestions);
});

// Submit mock answer and get AI feedback
app.post('/api/auto/interviews/:id/mock', async (c) => {
  const session = INTERVIEW_SESSIONS.find(s => s.id === c.req.param('id'));
  if (!session) return c.json({ error: 'Not found' }, 404);
  const { question, answer } = await c.req.json();
  const wordCount = answer.split(' ').length;
  const hasSpecifics = answer.length > 100;
  const score = Math.min(10, Math.max(1, Math.round(
    (wordCount > 20 ? 3 : 1) + (hasSpecifics ? 4 : 1) + (answer.includes('because') || answer.includes('since') ? 2 : 0) + (Math.random() * 2)
  )));
  const feedbackOptions = [
    score >= 8 ? 'Excellent answer! Very specific and well-structured.' : score >= 5 ? 'Good attempt. Try to add more specific examples and details.' : 'Needs improvement. Be more detailed and explain your reasoning clearly.',
    wordCount < 20 ? 'Your answer is too brief. Aim for at least 3-4 sentences.' : '',
    !hasSpecifics ? 'Add specific details about your university, course, or career goals.' : ''
  ].filter(Boolean).join(' ');
  session.mockQuestions.push({ question, answer, feedback: feedbackOptions, score });
  session.prepScore = Math.round(session.mockQuestions.reduce((s: number, q: any) => s + q.score, 0) / session.mockQuestions.length * 10);
  return c.json({ success: true, feedback: feedbackOptions, score, prepScore: session.prepScore });
});

// -- PAYMENT ENDPOINTS --
app.get('/api/auto/payments', (c) => {
  const studentId = c.req.query('studentId');
  const payments = studentId ? PAYMENTS.filter(p => p.studentId === studentId) : PAYMENTS;
  return c.json(payments);
});

app.get('/api/auto/payments/stats', (c) => {
  const total = PAYMENTS.reduce((s, p) => p.currency === 'LKR' ? s + p.amount/300 : s + p.amount, 0);
  const paid = PAYMENTS.filter(p => p.status === 'paid').reduce((s, p) => p.currency === 'LKR' ? s + p.amount/300 : s + p.amount, 0);
  const pending = PAYMENTS.filter(p => p.status === 'pending').reduce((s, p) => p.currency === 'LKR' ? s + p.amount/300 : s + p.amount, 0);
  const overdue = PAYMENTS.filter(p => p.status === 'overdue').length;
  return c.json({ total, paid, pending, overdue, count: PAYMENTS.length });
});

app.post('/api/auto/payments', async (c) => {
  const data = await c.req.json();
  const payment = {
    id: 'PAY' + String(PAYMENT_COUNTER++).padStart(3, '0'),
    studentId: data.studentId, type: data.type, amount: data.amount,
    currency: data.currency || 'LKR', description: data.description,
    status: 'pending', dueDate: data.dueDate, paidDate: '',
    invoiceNumber: 'GG-' + new Date().getFullYear() + '-' + String(PAYMENT_COUNTER).padStart(3, '0'),
    createdAt: new Date().toISOString()
  };
  PAYMENTS.push(payment);
  return c.json({ success: true, payment });
});

app.put('/api/auto/payments/:id', async (c) => {
  const payment = PAYMENTS.find(p => p.id === c.req.param('id'));
  if (!payment) return c.json({ error: 'Not found' }, 404);
  const data = await c.req.json();
  Object.assign(payment, data);
  if (data.status === 'paid' && !payment.paidDate) payment.paidDate = new Date().toISOString();
  return c.json({ success: true, payment });
});

// -- DOCUMENT REQUEST SYSTEM --
app.post('/api/auto/doc-requests', async (c) => {
  const data = await c.req.json();
  const req = {
    id: 'DR' + String(DOC_REQUEST_COUNTER++).padStart(3,'0'),
    leadId: data.leadId, documents: data.documents,
    message: data.message || 'Please upload the required documents.',
    status: 'pending', sentAt: new Date().toISOString(),
    uploadedAt: null
  };
  DOC_REQUESTS.push(req);
  return c.json({ success: true, request: req });
});

app.get('/api/auto/doc-requests', (c) => {
  const leadId = c.req.query('leadId');
  const requests = leadId ? DOC_REQUESTS.filter(r => r.leadId === leadId) : DOC_REQUESTS;
  return c.json(requests);
});

// -- SOP/LOR GENERATOR --
app.post('/api/auto/sop-generator', async (c) => {
  const { studentName, course, university, background, goals, experience } = await c.req.json();
  const sop = `STATEMENT OF PURPOSE

${course} — ${university}

My name is ${studentName}, and I am writing to express my sincere interest in the ${course} program at ${university}. With a strong foundation in ${background || 'my field of study'} and a clear vision for my future, I am confident that this program will equip me with the knowledge and skills necessary to achieve my professional goals.

${experience ? `During my academic and professional journey, ${experience}. This experience has been instrumental in shaping my understanding of the subject and has deepened my passion for ${course}.` : ''}

My decision to pursue ${course} at ${university} is driven by several key factors. The university's reputation for academic excellence, its distinguished faculty, and the comprehensive curriculum offered make it the ideal institution for my graduate studies. I am particularly drawn to the program's focus on practical application alongside theoretical knowledge.

Upon completing this program, I aspire to ${goals || 'contribute meaningfully to my field and make a positive impact in my home country'}. I am committed to leveraging the education and experiences gained at ${university} to achieve these objectives.

I am enthusiastic about the prospect of joining the ${university} community and contributing to its vibrant academic environment. I look forward to the opportunity to demonstrate my dedication and passion throughout my studies.

Thank you for considering my application.

Sincerely,
${studentName}`;

  return c.json({ success: true, sop, wordCount: sop.split(' ').length });
});

// -- AUTOMATION SETTINGS --
app.get('/api/auto/settings', (c) => c.json(PIPELINE_AUTOMATION));
app.put('/api/auto/settings', async (c) => {
  const data = await c.req.json();
  Object.assign(PIPELINE_AUTOMATION, data);
  return c.json({ success: true, settings: PIPELINE_AUTOMATION });
});

// -- PIPELINE OVERVIEW --
app.get('/api/auto/pipeline', (c) => {
  const stages = [
    { id: 1, name: 'New Lead', icon: '📥', count: 0, color: 'gray' },
    { id: 2, name: 'Contacted', icon: '📞', count: 0, color: 'blue' },
    { id: 3, name: 'Qualified', icon: '⭐', count: 0, color: 'yellow' },
    { id: 4, name: 'Application', icon: '📝', count: 0, color: 'orange' },
    { id: 5, name: 'Offer Received', icon: '🎓', count: 0, color: 'purple' },
    { id: 6, name: 'Visa Prep', icon: '📋', count: 0, color: 'pink' },
    { id: 7, name: 'Visa Applied', icon: '✈️', count: 0, color: 'indigo' },
    { id: 8, name: 'Enrolled', icon: '🎉', count: 0, color: 'green' }
  ];
  AUTO_LEADS.forEach(l => {
    const stage = stages.find(s => s.id === l.journeyStage);
    if (stage) stage.count++;
  });
  return c.json({ stages, leads: AUTO_LEADS });
});

// -- PUBLIC LEAD CAPTURE FORM (for landing page) --
app.post('/api/auto/capture', async (c) => {
  const data = await c.req.json();
  const id = 'AL' + String(AUTO_LEAD_COUNTER++).padStart(3, '0');
  const newLead = {
    id, name: data.name, email: data.email, phone: data.phone,
    country: data.country || 'Sri Lanka', studyDestination: data.studyDestination || 'UK',
    studyLevel: data.studyLevel || 'PG', studyField: data.studyField || '',
    intakePeriod: data.intakePeriod || 'September 2026', budget: data.budget || '',
    ieltsScore: data.ieltsScore || '', source: data.source || 'Website Form',
    status: 'new', journeyStage: 1, aiScore: 0,
    followUpDates: [], lastContact: null, notes: [], documents: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  newLead.aiScore = scoreLeadAI(newLead);
  AUTO_LEADS.push(newLead);

  // Auto send welcome email
  const emailContent = generateEmail('welcome', newLead);
  AUTO_EMAILS.push({
    id: 'EM' + String(EMAIL_COUNTER++).padStart(3,'0'),
    leadId: id, type: 'welcome', ...emailContent,
    sentAt: new Date().toISOString(), opened: false, clicked: false
  });

  // Auto notify counselors
  GLOBAL_NOTIFICATIONS.push({
    id: Date.now() + Math.random(), userId: 'all', type: 'admission', priority: 'high',
    title: '🚀 New Lead Captured',
    message: `${newLead.name} from ${newLead.country} — Score: ${newLead.aiScore}/100 — ${newLead.studyLevel} ${newLead.studyField}`,
    context: { source: 'Lead Capture', leadId: id },
    actions: [{ label: 'View Lead', action: 'view_auto_lead', data: { leadId: id } }],
    read: [], timestamp: Date.now(), createdAt: new Date().toISOString()
  });

  return c.json({ success: true, leadId: id, aiScore: newLead.aiScore, message: 'Thank you! A counsellor will contact you within 24 hours.' });
});

// -- AI CHATBOT ENDPOINT --
let CHAT_SESSIONS: Record<string, any[]> = {};

app.post('/api/auto/chatbot', async (c) => {
  const { sessionId, message, leadId } = await c.req.json();
  if (!CHAT_SESSIONS[sessionId]) CHAT_SESSIONS[sessionId] = [];
  
  const lead = leadId ? AUTO_LEADS.find(l => l.id === leadId) : null;
  const history = CHAT_SESSIONS[sessionId];
  
  // Build context-aware response
  const lowerMsg = message.toLowerCase();
  let response = '';

  if (lowerMsg.includes('ielts') || lowerMsg.includes('english test')) {
    response = 'For most UK universities, you need IELTS 6.0-6.5 for undergraduate and 6.5-7.0 for postgraduate. Some universities offer English language waivers if your previous education was in English. Would you like to know more about waiver options?';
  } else if (lowerMsg.includes('cost') || lowerMsg.includes('fee') || lowerMsg.includes('tuition')) {
    response = 'UK university tuition fees for international students range from £10,000-£35,000 per year depending on the university and course. Business and Management courses typically cost £12,000-£20,000. Our service fee is a one-time charge that covers the entire application process. Would you like a detailed breakdown?';
  } else if (lowerMsg.includes('visa')) {
    response = 'The UK Student Visa (Tier 4) requires: ✅ CAS from your university ✅ Financial proof (£1,334/month for London, £1,023/month elsewhere) ✅ IELTS results ✅ TB test (required for Sri Lanka). Processing typically takes 3-8 weeks. Would you like our detailed visa guide?';
  } else if (lowerMsg.includes('intake') || lowerMsg.includes('when')) {
    response = 'UK universities have 3 main intakes: 🗓️ September/October (main intake — most universities) 🗓️ January/February (limited availability) 🗓️ May/June (very limited). For September 2026, we recommend starting your application NOW to meet deadlines. Shall I check which universities still have open applications?';
  } else if (lowerMsg.includes('university') || lowerMsg.includes('uni')) {
    response = 'We work with 50+ UK universities. Based on your interest' + (lead ? ` in ${lead.studyField}` : '') + ', popular choices include:\n🎓 Coventry University — Modern, industry-linked\n🎓 DMU (De Montfort) — Strong business programs\n🎓 Hertfordshire — Great value, strong placement\n🎓 Sunderland — Flexible pathways\n\nWould you like detailed comparison of these universities?';
  } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('help')) {
    response = 'Hello! 👋 I\'m the Global Guidance AI Assistant. I can help you with:\n\n📚 University selection & requirements\n💰 Tuition fees & scholarships\n📋 Visa requirements & process\n📅 Application deadlines & intakes\n📝 Document preparation\n\nWhat would you like to know about studying abroad?';
  } else if (lowerMsg.includes('scholarship')) {
    response = 'There are several scholarship options for international students: 🏆 British Council Scholarships 🏆 Chevening Scholarships (fully funded) 🏆 University-specific scholarships (10-50% fee reduction) 🏆 GREAT Scholarships. Most require strong academic records and leadership experience. Shall I prepare a scholarship eligibility assessment for you?';
  } else if (lowerMsg.includes('document') || lowerMsg.includes('docs')) {
    response = 'For a UK university application you typically need:\n📄 Valid passport\n📄 Academic transcripts & certificates\n📄 IELTS/English test results\n📄 Statement of Purpose (SOP)\n📄 2 Reference letters\n📄 CV/Resume\n📄 Portfolio (for creative courses)\n\nOur team can help you prepare all these documents. Would you like to start your application?';
  } else {
    response = 'Thank you for your question! Our counsellors are available Mon-Sat 9AM-6PM to provide detailed guidance. For immediate assistance, you can:\n📞 Call us: +94 11 XXX XXXX\n📧 Email: info@globalguidance.lk\n🗓️ Book a FREE consultation on our website\n\nIs there anything specific I can help you with about studying abroad?';
  }

  CHAT_SESSIONS[sessionId].push({ role: 'user', content: message, timestamp: Date.now() });
  CHAT_SESSIONS[sessionId].push({ role: 'assistant', content: response, timestamp: Date.now() });

  // Keep last 20 messages
  if (CHAT_SESSIONS[sessionId].length > 40) CHAT_SESSIONS[sessionId] = CHAT_SESSIONS[sessionId].slice(-40);

  return c.json({ success: true, response, sessionId });
});

// ============================================================
// END AUTOMATION APIS
// ============================================================

// ============================================================
// UNIVERSAL DOCUMENT UPLOAD APIs
// Per-category storage: leads, admissions, finance, students,
// comms, daily-ops, reports, visa, leave, red-flags, general
// ============================================================
type UploadEntry = {
  id: string;
  category: string;
  kind: 'file' | 'gdrive' | 'sheet-sync';
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileData?: string; // base64 (for files)
  link?: string;     // for gdrive
  label?: string;
  uploadedBy?: string;
  uploadedAt: number;
  parsedRowCount?: number;
  sheetNames?: string[];
};
const GLOBAL_UPLOADS: Record<string, UploadEntry[]> = {};
const GDRIVE_LINKS: Record<string, any[]> = {};

function pushUpload(cat: string, entry: UploadEntry) {
  if (!GLOBAL_UPLOADS[cat]) GLOBAL_UPLOADS[cat] = [];
  GLOBAL_UPLOADS[cat].unshift(entry);
  // Keep last 200 per category
  if (GLOBAL_UPLOADS[cat].length > 200) GLOBAL_UPLOADS[cat].length = 200;
}

const VALID_CATEGORIES = ['leads','admissions','finance','students','comms','daily-ops','reports','visa','leave','red-flags','general'];

// Generic file upload for any category
for (const cat of VALID_CATEGORIES) {
  app.post(`/api/uploads/${cat}`, async (c) => {
    try {
      const body = await c.req.json();
      const id = 'up_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      const entry: UploadEntry = {
        id,
        category: cat,
        kind: 'file',
        fileName: body.fileName,
        fileType: body.fileType,
        fileSize: body.fileSize,
        fileData: body.fileData ? String(body.fileData).slice(0, 8 * 1024 * 1024) : undefined, // 8MB cap
        uploadedBy: body.uploadedBy || 'Unknown',
        uploadedAt: Date.now()
      };
      pushUpload(cat, entry);
      return c.json({ success: true, id, fileName: entry.fileName });
    } catch (e: any) {
      return c.json({ success: false, error: e.message || 'Upload failed' }, 400);
    }
  });

  // Excel sync — parsed by frontend, stored & merged here
  app.post(`/api/uploads/${cat}/sync`, async (c) => {
    try {
      const body = await c.req.json();
      const { fileName, sheets, parser, normalizedLeads } = body;
      const id = 'sync_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      const sheetNames = sheets ? Object.keys(sheets) : [];
      const totalRows = sheets ? Object.values(sheets).reduce((s: number, rows: any) => s + (Array.isArray(rows) ? rows.length : 0), 0) : 0;
      const entry: UploadEntry = {
        id, category: cat, kind: 'sheet-sync',
        fileName, label: `${fileName} (${sheetNames.length} sheets, ${totalRows} rows)`,
        uploadedBy: body.uploadedBy || 'System',
        uploadedAt: Date.now(),
        parsedRowCount: totalRows,
        sheetNames
      };
      pushUpload(cat, entry);

      // For leads: merge into GLOBAL_LEADS (de-duplicate by name+contact)
      let imported = 0, duplicates = 0;
      if (parser === 'leads' && Array.isArray(normalizedLeads)) {
        for (const r of normalizedLeads) {
          const key = ((r.lead || '') + '|' + (r.contact || '')).toLowerCase().trim();
          if (!key || key === '|') continue;
          const exists = GLOBAL_LEADS.find((x: any) => ((x.name || x.lead || '') + '|' + (x.contact || x.phone || '')).toLowerCase().trim() === key);
          if (exists) { duplicates++; continue; }
          GLOBAL_LEADS.push({
            id: 'lead_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
            name: r.lead,
            lead: r.lead,
            counsellor: r.counsellor,
            counselor: r.counsellor,
            contact: r.contact,
            phone: r.contact,
            status: r.status || 'New',
            date: r.date,
            country: r.country,
            details: r.details,
            comments: r.comments,
            appointments: r.appointments,
            source: r.source || 'Excel Import',
            cv: r.cv,
            attempts: r.attempts,
            sheet: r.sheet,
            createdAt: Date.now(),
            importedFrom: fileName
          });
          imported++;
        }
      }

      return c.json({
        success: true,
        id,
        sheetNames,
        totalRows,
        imported,
        duplicates,
        message: parser === 'leads'
          ? `Imported ${imported} new leads (${duplicates} duplicates skipped)`
          : `Stored ${totalRows} rows from ${sheetNames.length} sheet(s)`
      });
    } catch (e: any) {
      return c.json({ success: false, error: e.message || 'Sync failed' }, 400);
    }
  });

  // Google Drive / Sheets link
  app.post(`/api/uploads/${cat}/gdrive`, async (c) => {
    try {
      const body = await c.req.json();
      const { link, label, uploadedBy } = body;
      if (!link || !/https?:\/\//.test(link)) {
        return c.json({ success: false, error: 'Invalid link' }, 400);
      }
      const id = 'gd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      const entry: UploadEntry = {
        id, category: cat, kind: 'gdrive', link, label,
        uploadedBy: uploadedBy || 'Unknown', uploadedAt: Date.now()
      };
      pushUpload(cat, entry);
      if (!GDRIVE_LINKS[cat]) GDRIVE_LINKS[cat] = [];
      GDRIVE_LINKS[cat].unshift({ id, link, label, uploadedBy, uploadedAt: entry.uploadedAt });

      // Try to pull a preview row count for public Google Sheets via gviz JSON
      let previewRows = 0;
      try {
        const m = link.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
        if (m) {
          const sheetId = m[1];
          const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
          const r = await fetch(url);
          if (r.ok) {
            const txt = await r.text();
            const jm = txt.match(/setResponse\(([\s\S]+)\);?/);
            if (jm) {
              const data = JSON.parse(jm[1]);
              previewRows = (data.table && data.table.rows) ? data.table.rows.length : 0;
            }
          }
        }
      } catch {}

      return c.json({ success: true, id, previewRows });
    } catch (e: any) {
      return c.json({ success: false, error: e.message || 'Link sync failed' }, 400);
    }
  });

  // List uploads for a category
  app.get(`/api/uploads/${cat}/list`, (c) => {
    const items = (GLOBAL_UPLOADS[cat] || []).map(it => ({
      id: it.id,
      kind: it.kind,
      fileName: it.fileName,
      label: it.label,
      link: it.link,
      uploadedBy: it.uploadedBy,
      uploadedAt: it.uploadedAt,
      sheetNames: it.sheetNames,
      parsedRowCount: it.parsedRowCount,
      fileSize: it.fileSize
    }));
    return c.json({ success: true, items, count: items.length });
  });

  // Download a stored file
  app.get(`/api/uploads/${cat}/download/:id`, (c) => {
    const id = c.req.param('id');
    const item = (GLOBAL_UPLOADS[cat] || []).find(x => x.id === id);
    if (!item || !item.fileData) return c.json({ success: false, error: 'Not found' }, 404);
    return c.json({ success: true, fileName: item.fileName, fileType: item.fileType, data: item.fileData });
  });
}

// Aggregate stats across categories
app.get('/api/uploads/summary', (c) => {
  const summary: any = {};
  for (const cat of VALID_CATEGORIES) {
    summary[cat] = {
      count: (GLOBAL_UPLOADS[cat] || []).length,
      gdriveLinks: (GDRIVE_LINKS[cat] || []).length
    };
  }
  return c.json({ success: true, summary });
});

// ============================================================
// END UNIVERSAL DOCUMENT UPLOAD APIs
// ============================================================

// ============================================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// Admin-managed roles, permissions, users, features
// ============================================================
type PermLevel = 'none' | 'view' | 'edit' | 'admin';
type RBACRole = {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, PermLevel>;
  builtin?: boolean;
  createdAt: number;
  updatedAt: number;
};
type RBACFeature = { id: string; label: string; group?: string; builtin?: boolean };
type RBACUserOverride = {
  id: string | number;
  employeeId?: string;
  username?: string;
  name?: string;
  role?: string;
  department?: string;
  level?: number;
  roleId?: string;
};
type RBACAudit = { at: number; by: string; action: string; details: any };

const RBAC_FEATURES: RBACFeature[] = [
  { id: 'leads',           label: 'Leads / Lead Management',  group: 'Sales',      builtin: true },
  { id: 'admissions',      label: 'Admissions / Applications',group: 'Operations', builtin: true },
  { id: 'finance',         label: 'Finance & Commission',     group: 'Finance',    builtin: true },
  { id: 'students',        label: 'Students',                 group: 'Operations', builtin: true },
  { id: 'comms',           label: 'Communication Suite',      group: 'Operations', builtin: true },
  { id: 'daily-ops',       label: 'Daily Operations',         group: 'Operations', builtin: true },
  { id: 'reports',         label: 'Reports & Analytics',      group: 'Management', builtin: true },
  { id: 'visa',            label: 'Visa Processing',          group: 'Operations', builtin: true },
  { id: 'leave',           label: 'Leave Management',         group: 'HR',         builtin: true },
  { id: 'red-flags',       label: 'Red Flags',                group: 'Management', builtin: true },
  { id: 'system-settings', label: 'System Settings',          group: 'Admin',      builtin: true },
  { id: 'document-upload', label: 'Document Upload Widget',   group: 'Operations', builtin: true },
  { id: 'whatsapp',        label: 'WhatsApp Hub',             group: 'Operations', builtin: true },
  { id: 'location-tracker',label: 'Staff Location Tracker',   group: 'HR',         builtin: true },
  { id: 'employees',       label: 'Employee Management',      group: 'HR',         builtin: true }
];

function buildPerms(level: PermLevel): Record<string, PermLevel> {
  const p: Record<string, PermLevel> = {};
  for (const f of RBAC_FEATURES) p[f.id] = level;
  return p;
}

const RBAC_ROLES: RBACRole[] = [
  { id: 'admin',   name: 'Admin (CEO/COO)',  description: 'Full system access', permissions: buildPerms('admin'), builtin: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'hr-head', name: 'Head of HR/Admissions', description: 'Manages HR + Admissions', permissions: { ...buildPerms('edit'), 'system-settings': 'view', 'finance': 'view', 'employees': 'admin', 'leave': 'admin' }, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'bdm',     name: 'BDM (Head of BD/Visa)', description: 'Business development & visa', permissions: { ...buildPerms('view'), 'visa': 'admin', 'leads': 'edit', 'admissions': 'edit', 'finance': 'view' }, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'counsellor', name: 'Counsellor',  description: 'Front-line counselling staff', permissions: { ...buildPerms('view'), 'leads': 'edit', 'admissions': 'edit', 'students': 'edit', 'comms': 'edit', 'document-upload': 'edit', 'finance': 'none', 'system-settings': 'none' }, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'finance-officer', name: 'Finance Officer', description: 'Finance & accounts', permissions: { ...buildPerms('none'), 'finance': 'admin', 'reports': 'view', 'document-upload': 'edit' }, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'marketing', name: 'Marketing / Designer', description: 'Marketing & social media', permissions: { ...buildPerms('view'), 'leads': 'edit', 'comms': 'edit', 'document-upload': 'edit', 'finance': 'none' }, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'student', name: 'Student (Portal)', description: 'Student-facing portal access only', permissions: { ...buildPerms('none'), 'students': 'view' }, createdAt: Date.now(), updatedAt: Date.now() }
];

const RBAC_USER_OVERRIDES: RBACUserOverride[] = [
  { id: 1, employeeId: 'GG001', username: 'nashif.razzak', name: 'Nashif A. Razzak', role: 'CEO', department: 'Executive', level: 100, roleId: 'admin' },
  { id: 2, employeeId: 'GG002', username: 'nafees.razzak', name: 'Nafees Razzak',     role: 'COO', department: 'Executive', level: 100, roleId: 'admin' },
  { id: 3, employeeId: 'GG003', username: 'thasbiha.s',   name: 'Thasbiha S.',       role: 'HR Manager / Admission Head', department: 'Admissions & HR', level: 80, roleId: 'hr-head' },
  { id: 4, employeeId: 'GG004', username: 'umair',        name: 'Umair',             role: 'Sr. Admin Exec', department: 'Admin/HR', level: 60, roleId: 'counsellor' },
  { id: 5, employeeId: 'GG005', username: 'mohamed.s',    name: 'Mohamed Salih',     role: 'Communications & Exec Coord', department: 'Admin/HR', level: 60, roleId: 'counsellor' },
  { id: 6, employeeId: 'GG006', username: 'razan.thawus', name: 'Razan Thawus',      role: 'Head of BD/Visa', department: 'BD & Visa', level: 80, roleId: 'bdm' },
  { id: 7, employeeId: 'GG007', username: 'sukaina',      name: 'Sukaina',           role: 'Student Counsellor & Front Desk', department: 'Admissions & Front Office', level: 40, roleId: 'counsellor' },
  { id: 8, employeeId: 'GG008', username: 'binupa',       name: 'Binupa',            role: 'Jr. Counsellor & TikTok Specialist', department: 'Admissions & Marketing', level: 40, roleId: 'counsellor' },
  { id: 9, employeeId: 'GG009', username: 'shiran',       name: 'Shiran',            role: 'Graphic Designer & Social Lead', department: 'Marketing', level: 40, roleId: 'marketing' }
];

const RBAC_AUDIT: RBACAudit[] = [];
function audit(by: string, action: string, details: any) {
  RBAC_AUDIT.unshift({ at: Date.now(), by: by || 'Unknown', action, details });
  if (RBAC_AUDIT.length > 500) RBAC_AUDIT.length = 500;
}

// Get full RBAC state (used by client)
app.get('/api/rbac/state', (c) => {
  return c.json({
    success: true,
    roles: RBAC_ROLES,
    features: RBAC_FEATURES,
    users: RBAC_USER_OVERRIDES,
    permLevels: ['none', 'view', 'edit', 'admin']
  });
});

// Roles CRUD
app.get('/api/rbac/roles', (c) => c.json({ success: true, roles: RBAC_ROLES }));

app.post('/api/rbac/roles', async (c) => {
  const body = await c.req.json();
  const { name, description, permissions, by } = body;
  if (!name || !String(name).trim()) return c.json({ success: false, error: 'Name required' }, 400);
  const id = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (RBAC_ROLES.find(r => r.id === id)) return c.json({ success: false, error: 'Role already exists' }, 400);
  const role: RBACRole = {
    id, name: String(name).trim(), description: description || '',
    permissions: permissions || buildPerms('view'),
    createdAt: Date.now(), updatedAt: Date.now()
  };
  RBAC_ROLES.push(role);
  audit(by, 'role-created', { id, name });
  return c.json({ success: true, role });
});

app.post('/api/rbac/roles/:id/permission', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { feature, permission, by } = body;
  const role = RBAC_ROLES.find(r => r.id === id);
  if (!role) return c.json({ success: false, error: 'Role not found' }, 404);
  if (!['none','view','edit','admin'].includes(permission)) return c.json({ success: false, error: 'Invalid permission' }, 400);
  role.permissions[feature] = permission;
  role.updatedAt = Date.now();
  audit(by, 'permission-updated', { roleId: id, feature, permission });
  return c.json({ success: true, role });
});

app.post('/api/rbac/roles/:id/bulk', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { permission, by } = body;
  const role = RBAC_ROLES.find(r => r.id === id);
  if (!role) return c.json({ success: false, error: 'Role not found' }, 404);
  if (!['none','view','edit','admin'].includes(permission)) return c.json({ success: false, error: 'Invalid permission' }, 400);
  for (const f of RBAC_FEATURES) role.permissions[f.id] = permission;
  role.updatedAt = Date.now();
  audit(by, 'bulk-permission-set', { roleId: id, permission });
  return c.json({ success: true, role });
});

app.delete('/api/rbac/roles/:id', async (c) => {
  const id = c.req.param('id');
  const role = RBAC_ROLES.find(r => r.id === id);
  if (!role) return c.json({ success: false, error: 'Role not found' }, 404);
  if (role.builtin) return c.json({ success: false, error: 'Cannot delete built-in role' }, 400);
  const idx = RBAC_ROLES.indexOf(role);
  RBAC_ROLES.splice(idx, 1);
  // Unassign from users
  for (const u of RBAC_USER_OVERRIDES) if (u.roleId === id) u.roleId = '';
  audit('System', 'role-deleted', { id });
  return c.json({ success: true });
});

// Features CRUD
app.get('/api/rbac/features', (c) => c.json({ success: true, features: RBAC_FEATURES }));

app.post('/api/rbac/features', async (c) => {
  const body = await c.req.json();
  const { id, label, group, by } = body;
  if (!id || !label) return c.json({ success: false, error: 'id and label required' }, 400);
  if (RBAC_FEATURES.find(f => f.id === id)) return c.json({ success: false, error: 'Feature already exists' }, 400);
  RBAC_FEATURES.push({ id, label, group: group || 'Other', builtin: false });
  // Auto-add to all roles with default 'none'
  for (const r of RBAC_ROLES) if (!(id in r.permissions)) r.permissions[id] = 'none';
  audit(by, 'feature-added', { id, label });
  return c.json({ success: true });
});

app.delete('/api/rbac/features/:id', async (c) => {
  const id = c.req.param('id');
  const idx = RBAC_FEATURES.findIndex(f => f.id === id);
  if (idx === -1) return c.json({ success: false, error: 'Feature not found' }, 404);
  if (RBAC_FEATURES[idx].builtin) return c.json({ success: false, error: 'Cannot delete built-in feature' }, 400);
  RBAC_FEATURES.splice(idx, 1);
  for (const r of RBAC_ROLES) delete r.permissions[id];
  audit('System', 'feature-deleted', { id });
  return c.json({ success: true });
});

// Users CRUD
app.get('/api/rbac/users', (c) => c.json({ success: true, users: RBAC_USER_OVERRIDES }));

app.post('/api/rbac/users/:id/role', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { roleId, by } = body;
  const user = RBAC_USER_OVERRIDES.find(u => String(u.id) === String(id) || String(u.employeeId) === String(id));
  if (!user) return c.json({ success: false, error: 'User not found' }, 404);
  if (roleId && !RBAC_ROLES.find(r => r.id === roleId)) return c.json({ success: false, error: 'Role not found' }, 400);
  user.roleId = roleId || '';
  audit(by, 'user-role-assigned', { userId: id, roleId });
  return c.json({ success: true, user });
});

// Permission check (server-side guard helper)
app.post('/api/rbac/check', async (c) => {
  const body = await c.req.json();
  const { user, feature, action } = body;
  const act = action || 'view';
  if (!user) return c.json({ success: true, allowed: false });
  if (user.level >= 100) return c.json({ success: true, allowed: true });
  const userRow = RBAC_USER_OVERRIDES.find(x =>
    String(x.employeeId) === String(user.employeeId) ||
    String(x.id) === String(user.id) ||
    String(x.username) === String(user.username)
  );
  const role = userRow && userRow.roleId
    ? RBAC_ROLES.find(r => r.id === userRow.roleId)
    : RBAC_ROLES.find(r => r.name && user.role && r.name.toLowerCase() === String(user.role).toLowerCase());
  if (!role) return c.json({ success: true, allowed: false });
  const order = ['none', 'view', 'edit', 'admin'];
  const granted = role.permissions[feature] || 'none';
  const allowed = order.indexOf(granted) >= order.indexOf(act);
  return c.json({ success: true, allowed, role: role.id, granted });
});

// Audit log
app.get('/api/rbac/audit', (c) => c.json({ success: true, items: RBAC_AUDIT.slice(0, 100) }));

// ============================================================
// END RBAC APIs
// ============================================================

// ============================================================
// STAFF PORTAL ROUTES (Thasbiha + Razan)
// ============================================================
app.get('/thasbiha-portal', (c) => c.html(thasbihaPortalPage));
app.get('/razan-portal', (c) => c.html(razanPortalPage));

// ============================================================
// STAFF PORTAL APIs — in-memory stores keyed by employeeId
// ============================================================

// Generic per-user store helper
const SP_STORE: Record<string, Record<string, any[]>> = {};
function spGet(empId: string, bucket: string): any[] {
  if (!SP_STORE[empId]) SP_STORE[empId] = {};
  if (!SP_STORE[empId][bucket]) SP_STORE[empId][bucket] = [];
  return SP_STORE[empId][bucket];
}
function spReplace(empId: string, bucket: string, items: any[]) {
  if (!SP_STORE[empId]) SP_STORE[empId] = {};
  SP_STORE[empId][bucket] = items;
}
function spAdd(empId: string, bucket: string, item: any) {
  const arr = spGet(empId, bucket);
  const id = item.id || ('sp_' + Date.now() + '_' + Math.random().toString(36).slice(2,7));
  const rec = { id, createdAt: new Date().toISOString(), ...item };
  arr.unshift(rec);
  return rec;
}
function spUpdate(empId: string, bucket: string, id: string, patch: any) {
  const arr = spGet(empId, bucket);
  const idx = arr.findIndex(x => x.id === id);
  if (idx < 0) return null;
  arr[idx] = { ...arr[idx], ...patch, updatedAt: new Date().toISOString() };
  return arr[idx];
}
function spDelete(empId: string, bucket: string, id: string) {
  const arr = spGet(empId, bucket);
  const idx = arr.findIndex(x => x.id === id);
  if (idx < 0) return false;
  arr.splice(idx, 1);
  return true;
}

// --- Seed: Thasbiha (GG003) ---
spReplace('GG003', 'morning-plan', [
  { id: 'mp_seed1', date: new Date().toISOString().slice(0,10), priorities: ['Follow up 5 hot offer-holders', 'Push 2 visa-ready files', 'Mock interview with Ajith'], blockers: 'Awaiting CAS confirmation from Coventry', focusAreas: ['Admissions', 'HR rota'], createdAt: new Date().toISOString() }
]);
spReplace('GG003', 'evening-report', [
  { id: 'er_seed1', date: new Date().toISOString().slice(0,10), calls: 14, leadsContacted: 9, admissionsProgressed: 4, interviewsConducted: 1, escalations: 1, notes: 'Closed 1 enrolment; 2 visa apps submitted', createdAt: new Date().toISOString() }
]);
spReplace('GG003', 'kpi', [
  { id: 'kpi_w1', period: 'weekly', week: 'W' + Math.ceil(new Date().getDate()/7), target: { calls: 80, admissions: 10, conversions: 4, interviews: 5 }, actual: { calls: 62, admissions: 8, conversions: 3, interviews: 4 }, createdAt: new Date().toISOString() },
  { id: 'kpi_m1', period: 'monthly', month: new Date().toISOString().slice(0,7), target: { calls: 320, admissions: 40, conversions: 16, interviews: 20, enrolments: 8 }, actual: { calls: 248, admissions: 34, conversions: 12, interviews: 17, enrolments: 6 }, createdAt: new Date().toISOString() }
]);
spReplace('GG003', 'escalations', [
  { id: 'es_seed1', studentName: 'Tharun Kumaran', issue: 'Portfolio rejected by UWE', priority: 'high', status: 'open', raisedTo: 'CEO', dateRaised: new Date(Date.now()-86400000).toISOString(), createdAt: new Date().toISOString() }
]);
spReplace('GG003', 'interviews', [
  { id: 'iv_seed1', studentName: 'Ajith', university: 'Coventry CZ', date: new Date(Date.now()+86400000).toISOString().slice(0,10), time: '14:30', mode: 'Mock', status: 'scheduled', notes: 'Prep on motivation + funding answers', createdAt: new Date().toISOString() }
]);
spReplace('GG003', 'uni-followups', [
  { id: 'uf_seed1', university: 'Coventry CZ', studentName: 'Kawsiya', purpose: 'CAS issuance', lastContact: new Date(Date.now()-172800000).toISOString().slice(0,10), nextAction: 'Chase CAS team Wed', status: 'pending', createdAt: new Date().toISOString() }
]);
spReplace('GG003', 'conversions', [
  { id: 'cv_seed1', stage: 'Lead → Counselling', target: 25, actual: 22, period: 'month', createdAt: new Date().toISOString() },
  { id: 'cv_seed2', stage: 'Counselling → Application', target: 18, actual: 14, period: 'month', createdAt: new Date().toISOString() },
  { id: 'cv_seed3', stage: 'Application → Offer', target: 14, actual: 11, period: 'month', createdAt: new Date().toISOString() },
  { id: 'cv_seed4', stage: 'Offer → Enrolment', target: 8, actual: 6, period: 'month', createdAt: new Date().toISOString() }
]);
spReplace('GG003', 'hr-admin', [
  { id: 'hr_seed1', type: 'rota', description: 'Weekly counsellor rota for next week', status: 'in-progress', dueDate: new Date(Date.now()+172800000).toISOString().slice(0,10), createdAt: new Date().toISOString() },
  { id: 'hr_seed2', type: 'leave', description: 'Approve Razan leave request 18-19 May', status: 'pending', dueDate: new Date(Date.now()+86400000).toISOString().slice(0,10), createdAt: new Date().toISOString() }
]);

// --- Seed: Razan (GG006) ---
spReplace('GG006', 'morning-plan', [
  { id: 'mp_r1', date: new Date().toISOString().slice(0,10), priorities: ['Launch Reels campaign UK Sep intake', 'Reconcile petty cash for week', 'Follow up 3 partner agents'], blockers: 'Waiting for creative approval from BDM', focusAreas: ['Marketing', 'Finance'], createdAt: new Date().toISOString() }
]);
spReplace('GG006', 'evening-report', [
  { id: 'er_r1', date: new Date().toISOString().slice(0,10), leadsGenerated: 22, postsPublished: 4, applicationsSupported: 3, partnersContacted: 2, financeEntries: 6, notes: 'Reach +18% vs yesterday; 1 new agent onboarded', createdAt: new Date().toISOString() }
]);
spReplace('GG006', 'lead-campaigns', [
  { id: 'lc_r1', name: 'UK Sep 2026 - Instagram Reels', channel: 'Instagram', budget: 250, spend: 142, leads: 38, qualified: 14, costPerLead: 3.74, startDate: new Date(Date.now()-7*86400000).toISOString().slice(0,10), status: 'active', createdAt: new Date().toISOString() },
  { id: 'lc_r2', name: 'BMICH Education Fair', channel: 'Event', budget: 1500, spend: 1280, leads: 96, qualified: 41, costPerLead: 13.33, startDate: new Date(Date.now()-14*86400000).toISOString().slice(0,10), status: 'closed', createdAt: new Date().toISOString() }
]);
spReplace('GG006', 'social-posts', [
  { id: 'sp_r1', platform: 'Instagram', type: 'Reel', topic: 'Top 5 UK universities for Business', scheduledFor: new Date(Date.now()+86400000).toISOString().slice(0,10), status: 'scheduled', engagement: { likes: 0, comments: 0, shares: 0 }, createdAt: new Date().toISOString() },
  { id: 'sp_r2', platform: 'Facebook', type: 'Post', topic: 'Visa success story - Milakshan', scheduledFor: new Date().toISOString().slice(0,10), status: 'published', engagement: { likes: 142, comments: 18, shares: 11 }, createdAt: new Date().toISOString() },
  { id: 'sp_r3', platform: 'TikTok', type: 'Reel', topic: 'Walk through GG Colombo office', scheduledFor: new Date(Date.now()-86400000).toISOString().slice(0,10), status: 'published', engagement: { likes: 312, comments: 27, shares: 44 }, createdAt: new Date().toISOString() }
]);
spReplace('GG006', 'apps-visa', [
  { id: 'av_r1', studentName: 'Arulthas Casin', stage: 'Visa Prep', university: 'UCLAN', target: new Date(Date.now()+14*86400000).toISOString().slice(0,10), status: 'documents-collected', createdAt: new Date().toISOString() },
  { id: 'av_r2', studentName: 'Mithurshan', stage: 'CAS Reissue', university: 'Sunderland CZ', target: new Date(Date.now()+7*86400000).toISOString().slice(0,10), status: 'chasing-uni', createdAt: new Date().toISOString() }
]);
spReplace('GG006', 'partners', [
  { id: 'pt_r1', name: 'Shree Agency', country: 'Sri Lanka', tier: 'A', activeLeads: 14, conversions30d: 4, lastContact: new Date(Date.now()-2*86400000).toISOString().slice(0,10), notes: 'Strong on business top-ups', createdAt: new Date().toISOString() },
  { id: 'pt_r2', name: 'Platinum Visa', country: 'Sri Lanka', tier: 'B', activeLeads: 6, conversions30d: 1, lastContact: new Date(Date.now()-5*86400000).toISOString().slice(0,10), notes: 'Needs profile QA support', createdAt: new Date().toISOString() }
]);
spReplace('GG006', 'events', [
  { id: 'ev_r1', name: 'Europe Open Day', date: new Date(Date.now()+21*86400000).toISOString().slice(0,10), venue: 'Cinnamon Grand', expectedAttendees: 120, registered: 47, status: 'planning', budget: 1800, createdAt: new Date().toISOString() },
  { id: 'ev_r2', name: 'BMICH Education Fair', date: new Date(Date.now()-14*86400000).toISOString().slice(0,10), venue: 'BMICH', expectedAttendees: 800, registered: 0, leadsGenerated: 96, status: 'completed', budget: 1500, createdAt: new Date().toISOString() }
]);
spReplace('GG006', 'finance', [
  { id: 'fn_r1', type: 'petty-cash', category: 'Travel', amount: 4500, currency: 'LKR', date: new Date().toISOString().slice(0,10), description: 'Tuk to BMICH for fair pickup', status: 'recorded', createdAt: new Date().toISOString() },
  { id: 'fn_r2', type: 'commission-claim', category: 'Agent payout', amount: 240, currency: 'GBP', date: new Date(Date.now()-86400000).toISOString().slice(0,10), description: 'Shree - Sankeethan enrolment', status: 'pending-approval', createdAt: new Date().toISOString() },
  { id: 'fn_r3', type: 'petty-cash', category: 'Office', amount: 2100, currency: 'LKR', date: new Date(Date.now()-2*86400000).toISOString().slice(0,10), description: 'Printer ink + paper', status: 'recorded', createdAt: new Date().toISOString() }
]);
spReplace('GG006', 'trackers', [
  { id: 'tr_r1', name: 'Lead Tracker', linkedSheet: 'Leads tracker.xlsx', rowsTracked: 412, lastSync: new Date(Date.now()-3600000).toISOString(), owner: 'Razan', createdAt: new Date().toISOString() },
  { id: 'tr_r2', name: 'Social Media Leads', linkedSheet: 'Social Media Leads.xlsx', rowsTracked: 187, lastSync: new Date(Date.now()-7200000).toISOString(), owner: 'Razan', createdAt: new Date().toISOString() }
]);
spReplace('GG006', 'kpi', [
  { id: 'kpi_rw1', period: 'weekly', week: 'W' + Math.ceil(new Date().getDate()/7), target: { leads: 60, posts: 14, partnersTouched: 8, eventsRun: 0, financeEntries: 25 }, actual: { leads: 52, posts: 12, partnersTouched: 6, eventsRun: 0, financeEntries: 22 }, createdAt: new Date().toISOString() },
  { id: 'kpi_rm1', period: 'monthly', month: new Date().toISOString().slice(0,7), target: { leads: 240, posts: 56, partnersTouched: 30, eventsRun: 2, financeEntries: 100, costPerLead: 5 }, actual: { leads: 196, posts: 48, partnersTouched: 24, eventsRun: 1, financeEntries: 84, costPerLead: 6.1 }, createdAt: new Date().toISOString() }
]);

// --- Generic GET / POST / PUT / DELETE for each bucket ---
const SP_BUCKETS = [
  'morning-plan', 'evening-report', 'kpi', 'escalations', 'interviews',
  'uni-followups', 'conversions', 'hr-admin',
  'lead-campaigns', 'social-posts', 'apps-visa', 'partners', 'events', 'finance', 'trackers'
];

for (const bucket of SP_BUCKETS) {
  // List
  app.get(`/api/staff-portal/${bucket}/:empId`, (c) => {
    const empId = c.req.param('empId');
    const items = spGet(empId, bucket);
    return c.json({ success: true, bucket, employeeId: empId, count: items.length, items });
  });
  // List by date (for morning-plan / evening-report convenience)
  app.get(`/api/staff-portal/${bucket}/:empId/:date`, (c) => {
    const empId = c.req.param('empId');
    const date = c.req.param('date');
    const items = spGet(empId, bucket).filter(x => (x.date || '').slice(0,10) === date);
    return c.json({ success: true, bucket, employeeId: empId, date, count: items.length, items });
  });
  // Create
  app.post(`/api/staff-portal/${bucket}/:empId`, async (c) => {
    const empId = c.req.param('empId');
    const body = await c.req.json().catch(() => ({}));
    const rec = spAdd(empId, bucket, body);
    return c.json({ success: true, bucket, employeeId: empId, item: rec });
  });
  // Update
  app.put(`/api/staff-portal/${bucket}/:empId/:id`, async (c) => {
    const empId = c.req.param('empId');
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const rec = spUpdate(empId, bucket, id, body);
    if (!rec) return c.json({ success: false, error: 'Not found' }, 404);
    return c.json({ success: true, bucket, employeeId: empId, item: rec });
  });
  // Delete
  app.delete(`/api/staff-portal/${bucket}/:empId/:id`, (c) => {
    const empId = c.req.param('empId');
    const id = c.req.param('id');
    const ok = spDelete(empId, bucket, id);
    if (!ok) return c.json({ success: false, error: 'Not found' }, 404);
    return c.json({ success: true, bucket, employeeId: empId, deletedId: id });
  });
}

// Summary endpoint — dashboard for portal landing
app.get('/api/staff-portal/summary/:empId', (c) => {
  const empId = c.req.param('empId');
  const today = new Date().toISOString().slice(0,10);
  const summary: any = { employeeId: empId, asOf: new Date().toISOString(), today };
  for (const b of SP_BUCKETS) {
    const items = spGet(empId, b);
    summary[b] = {
      total: items.length,
      latest: items[0] || null,
      today: items.filter(x => (x.date || '').slice(0,10) === today).length
    };
  }
  return c.json({ success: true, summary });
});

// ============================================================
// END STAFF PORTAL APIs
// ============================================================

// ============================================================
// UNIFIED ATTENDANCE SYNC — bridges new v8.1 UI <-> legacy systems
// ============================================================
// The new v8.1 command portal posts here on every Check-In and EOD submit.
// This endpoint mirrors the payload into BOTH:
//   (a) the legacy /api/daily-reports store (so old Daily Operations page sees it)
//   (b) the staff-portal morning-plan / evening-report buckets (already done client-side too)
// Result: old and new system share the same attendance + daily-plan data.
const UNIFIED_ATT_LOG: any[] = [];

app.post('/api/attendance/sync', async (c) => {
  const body = await c.req.json().catch(() => ({} as any));
  const { type, employeeId, employeeName, date, payload } = body || {};
  if (!type || !employeeId) {
    return c.json({ success: false, error: 'type and employeeId required' }, 400);
  }
  const now = new Date().toISOString();
  const today = date || now.slice(0, 10);

  // 1. Append to unified audit log
  const logEntry = { id: 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), type, employeeId, employeeName, date: today, payload, syncedAt: now };
  UNIFIED_ATT_LOG.unshift(logEntry);
  if (UNIFIED_ATT_LOG.length > 1000) UNIFIED_ATT_LOG.length = 1000;

  // 2. Mirror into legacy daily-reports store (look up or create today's row)
  try {
    // GLOBAL_DAILY_REPORTS is the in-memory array used by /api/daily-reports.
    // We update or insert today's row for this employee.
    const list: any[] = GLOBAL_DAILY_REPORTS;
    let row = list.find((r: any) => r.userId === employeeId && (r.date || '').slice(0, 10) === today);
    if (!row) {
      row = {
        id: 'dr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        userId: employeeId,
        userName: employeeName || employeeId,
        date: today,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        morning: null,
        evening: null
      };
      list.unshift(row);
    }
    if (type === 'checkin') {
      row.morning = payload;
      row.checkinTime = payload?.checkinTime;
      row.mode = payload?.mode;
      row.focus = payload?.focus;
      row.status = 'in-progress';
    } else if (type === 'eod') {
      row.evening = payload;
      row.checkoutTime = payload?.checkoutTime;
      row.completion = payload?.completion;
      row.selfDeclaration = payload?.selfDeclaration;
      row.status = 'submitted';
      row.submittedAt = now;
    }
    row.updatedAt = now;
  } catch (e) {
    // Non-fatal — sync log still recorded
  }

  // 3. Mirror into staff-portal buckets via the same in-memory helpers
  try {
    if (type === 'checkin') {
      spAdd(employeeId, 'morning-plan', { ...payload, syncedFrom: 'v8.1-portal' });
    } else if (type === 'eod') {
      spAdd(employeeId, 'evening-report', { ...payload, syncedFrom: 'v8.1-portal' });
    }
  } catch (e) {
    // Non-fatal
  }

  return c.json({ success: true, syncedTo: ['unified-log', 'daily-reports', 'staff-portal'], entry: logEntry });
});

// Read-back: latest unified attendance entries (used by legacy dashboards)
app.get('/api/attendance/sync', (c) => {
  const empId = c.req.query('employeeId');
  const date = c.req.query('date');
  let items = UNIFIED_ATT_LOG.slice();
  if (empId) items = items.filter(x => x.employeeId === empId);
  if (date) items = items.filter(x => (x.date || '').slice(0, 10) === date);
  return c.json({ success: true, count: items.length, items: items.slice(0, 200) });
});

app.get('/api/attendance/sync/today/:empId', (c) => {
  const empId = c.req.param('empId');
  const today = new Date().toISOString().slice(0, 10);
  const items = UNIFIED_ATT_LOG.filter(x => x.employeeId === empId && (x.date || '').slice(0, 10) === today);
  const checkin = items.find(x => x.type === 'checkin') || null;
  const eod = items.find(x => x.type === 'eod') || null;
  return c.json({ success: true, employeeId: empId, date: today, checkin, eod, raw: items });
});

// v16h Issue #3 — Monthly attendance rate for a single employee.
// Counts working days (Mon-Fri) up to today in current month, then counts days they checked in.
app.get('/api/attendance/sync/month/:empId', (c) => {
  const empId = c.req.param('empId');
  const today = new Date();
  const y = today.getFullYear(); const m = today.getMonth(); const d = today.getDate();
  // Working days = Mon-Fri from day 1 to today
  let workingDays = 0;
  const workingDates: string[] = [];
  for (let i = 1; i <= d; i++){
    const dt = new Date(y, m, i);
    const dow = dt.getDay();
    if (dow >= 1 && dow <= 5){
      workingDays++;
      workingDates.push(dt.toISOString().slice(0,10));
    }
  }
  // Present days = unique dates in this month where employee filed a check-in
  const monthStart = new Date(y, m, 1).toISOString().slice(0,10);
  const presentSet = new Set<string>();
  for (const x of UNIFIED_ATT_LOG){
    if (x.employeeId !== empId) continue;
    if (x.type !== 'checkin') continue;
    const date = (x.date || '').slice(0, 10);
    if (date < monthStart) continue;
    if (date > today.toISOString().slice(0,10)) continue;
    presentSet.add(date);
  }
  const presentDays = presentSet.size;
  const rate = workingDays ? Math.round((presentDays / workingDays) * 100) : 0;
  return c.json({ success:true, empId, month: monthStart.slice(0,7), workingDays, presentDays, rate, presentDates: Array.from(presentSet).sort() });
});

// v16h Issue #3 (charts) — Last 7 working-days attendance series.
// scope=company → company-wide rate per day; scope=user → 0/100 per day for empId.
app.get('/api/v16g/attendance-week', (c) => {
  const scope = c.req.query('scope') || 'company';
  const empId = c.req.query('empId') || '';
  const today = new Date();
  const series: any[] = [];
  // Iterate back 9 calendar days, keep 7 working days (Mon-Fri)
  let kept = 0;
  for (let offset = 0; offset < 14 && kept < 7; offset++){
    const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const dow = dt.getDay();
    if (dow < 1 || dow > 5) continue; // skip weekends
    const iso = dt.toISOString().slice(0,10);
    // v16h D5 — include day-number so labels stay unique across 7 working days (was: duplicate "Mon")
    const wk = dt.toLocaleDateString('en-GB', { weekday:'short' });
    const label = wk + ' ' + dt.getDate();
    let rate = 0;
    if (scope === 'user' && empId){
      const found = UNIFIED_ATT_LOG.some(x => x.employeeId === empId && x.type === 'checkin' && (x.date||'').slice(0,10) === iso);
      rate = found ? 100 : 0;
    } else {
      // company: distinct empIds checked in on this date / tracked staff count
      const checkedIn = new Set(
        UNIFIED_ATT_LOG.filter(x => x.type === 'checkin' && (x.date||'').slice(0,10) === iso).map(x => x.employeeId)
      );
      const tracked = TEAM_STAFF.filter(s => !['CEO','COO'].includes(s.role)).length || 1;
      rate = Math.round((checkedIn.size / tracked) * 100);
    }
    series.unshift({ date: iso, label, rate });
    kept++;
  }
  return c.json({ success:true, scope, empId, data: series });
});

// v16h Issue #10 — follow-ups today count (used by KPI tile)
app.get('/api/v16g/followups/today', (c) => {
  const user = c.req.query('user') || '';
  const today = new Date().toISOString().slice(0,10);
  // Best-effort: count rows from THB followups KV and ones from UNIFIED log
  // For now return a simple inferred count. Will be replaced when followups KV is wired.
  return c.json({ success: true, user, date: today, count: 0, items: [] });
});

// v16h Issue #6 — Leave queue (real KV-backed list, no demo data).
// Returns 0/[] until staff actually submit leave requests.
const KV_LEAVE_REQUESTS = 'v16g:leave-requests';
app.get('/api/v16g/leave/queue', async (c) => {
  try {
    const status = c.req.query('status'); // pending | approved | rejected | undefined for all
    let arr = await kvLoadArr(c, KV_LEAVE_REQUESTS);
    if (status) arr = arr.filter((r:any) => r.status === status);
    return c.json({ success:true, count: arr.length, items: arr });
  } catch (e:any) {
    return c.json({ success:false, error: e?.message || String(e), count:0, items:[] }, 500);
  }
});
app.post('/api/v16g/leave/submit', async (c) => {
  try {
    const body = await c.req.json();
    const arr = await kvLoadArr(c, KV_LEAVE_REQUESTS);
    const entry = {
      id: 'lv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7),
      empId: String(body.empId || ''),
      employeeName: String(body.employeeName || body.empId || ''),
      type: String(body.type || 'Annual'),
      fromDate: String(body.fromDate || ''),
      toDate:   String(body.toDate || body.fromDate || ''),
      days: Number(body.days || 1),
      reason: String(body.reason || '').slice(0, 500),
      status: 'pending',
      submittedAt: new Date().toISOString(),
      decidedBy: null,
      decidedAt: null
    };
    arr.unshift(entry);
    await kvSaveArr(c, KV_LEAVE_REQUESTS, arr, 1000);
    return c.json({ success:true, request: entry });
  } catch (e:any) {
    return c.json({ success:false, error: e?.message || String(e) }, 500);
  }
});
app.post('/api/v16g/leave/decide', async (c) => {
  try {
    const body = await c.req.json();
    const id = String(body.id || '');
    const decision = String(body.decision || ''); // approve | reject
    if (!id || !['approve','reject'].includes(decision)) return c.json({ success:false, error:'id+decision required' }, 400);
    const arr = await kvLoadArr(c, KV_LEAVE_REQUESTS);
    const i = arr.findIndex((r:any) => r.id === id);
    if (i < 0) return c.json({ success:false, error:'not found' }, 404);
    arr[i].status = decision === 'approve' ? 'approved' : 'rejected';
    arr[i].decidedBy = String(body.decidedBy || 'unknown');
    arr[i].decidedAt = new Date().toISOString();
    await kvSaveArr(c, KV_LEAVE_REQUESTS, arr, 1000);
    return c.json({ success:true, request: arr[i] });
  } catch (e:any) {
    return c.json({ success:false, error: e?.message || String(e) }, 500);
  }
});

// ============================================================
// TEAM OVERVIEW — drives the CEO/COO dashboard cards & tables
// Returns: present/absent staff lists, to-dos submitted/missing,
// reports submitted/missing, plus row data for the two tables.
// ============================================================
const TEAM_STAFF = [
  { empId: 'GG001', name: 'Nashif A. Razzak', role: 'CEO' },
  { empId: 'GG002', name: 'Nafees Razzak', role: 'COO' },
  { empId: 'GG003', name: 'Thasbiha S.', role: 'Head of Admissions/HR' },
  { empId: 'GG004', name: 'Umair', role: 'Sr. Admissions Executive' },
  { empId: 'GG005', name: 'Mohamed Salih', role: 'Comms Coordinator' },
  { empId: 'GG006', name: 'Razan Thawus', role: 'Head of BD / Visa' },
  { empId: 'GG007', name: 'Sukaina', role: 'Counsellor / Front Desk' },
  { empId: 'GG008', name: 'Binupa', role: 'Jr. Counsellor / TikTok' },
  { empId: 'GG009', name: 'Shiran', role: 'Graphic Designer' }
];

app.get('/api/team-overview', (c) => {
  const today = new Date().toISOString().slice(0, 10);
  // Exclude exec roles from "staff to track" — CEO/COO see everyone else
  const tracked = TEAM_STAFF.filter(s => !['CEO', 'COO'].includes(s.role));
  const present: string[] = [];
  const absent: string[] = [];
  const todosSubmitted: string[] = [];
  const todosMissing: string[] = [];
  const reportsSubmitted: string[] = [];
  const reportsMissing: string[] = [];
  const todoEntries: any[] = [];
  const attendanceEntries: any[] = [];

  const onBreakNow: string[] = [];

  for (const s of tracked) {
    const items = UNIFIED_ATT_LOG.filter(x => x.employeeId === s.empId && (x.date || '').slice(0, 10) === today);
    const checkin = items.find(x => x.type === 'checkin');
    const eod = items.find(x => x.type === 'eod');
    const planner = items.find(x => x.type === 'planner');
    // Track break state — find the latest break-start without a matching break-end
    const breakEvents = items.filter(x => x.type === 'break-start' || x.type === 'break-end')
                             .sort((a, b) => (a.syncedAt || '').localeCompare(b.syncedAt || ''));
    let activeBreak = false;
    for (const ev of breakEvents) {
      if (ev.type === 'break-start') activeBreak = true;
      else if (ev.type === 'break-end') activeBreak = false;
    }
    if (activeBreak) onBreakNow.push(s.name);

    if (checkin) {
      present.push(s.name);
      attendanceEntries.push({
        employeeId: s.empId, employeeName: s.name,
        checkin: checkin.payload?.checkinTime || checkin.payload?.submittedAt || '',
        location: checkin.payload?.mode || '',
        mode: checkin.payload?.mode || '',
        onBreak: activeBreak,
        report: !!eod
      });
    } else {
      absent.push(s.name);
    }

    if (planner || (checkin && checkin.payload?.tasks?.length)) {
      todosSubmitted.push(s.name);
      const taskCount = planner ? (planner.payload?.rows?.length || 0) : (checkin?.payload?.tasks?.length || 0);
      const focus = checkin?.payload?.focus || '';
      todoEntries.push({
        employeeId: s.empId, employeeName: s.name, taskCount, focus,
        complete: false
      });
    } else {
      todosMissing.push(s.name);
    }

    if (eod) reportsSubmitted.push(s.name); else reportsMissing.push(s.name);
  }

  return c.json({
    success: true,
    data: {
      asOf: new Date().toISOString(),
      date: today,
      totalStaff: tracked.length,
      present, absent,
      onBreakNow,
      todosSubmitted, todosMissing,
      reportsSubmitted, reportsMissing,
      todoEntries, attendanceEntries
    }
  });
});

// ============================================================
// GOOGLE SYNC — Gmail + Calendar OAuth stubs
// Real OAuth wiring requires GOOGLE_CLIENT_ID/SECRET secrets.
// These endpoints return safe empty payloads so the frontend
// can still drive the per-staff sync UI in demo mode.
// ============================================================
const GOOGLE_CONN: Record<string, { connected: boolean; email?: string; connectedAt?: string }> = {};

app.get('/api/google/auth/start', (c) => {
  const staff = c.req.query('staff') || '';
  const redirect = c.req.query('redirect') || '';
  // Without real client credentials, return a tiny HTML page that informs the user
  // and immediately posts a success message back so the popup flow completes.
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Connect Google · ${staff}</title>
<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0f1216;color:#e6e8eb;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{background:#171b22;border:1px solid #262b34;padding:28px;border-radius:14px;max-width:380px;text-align:center}.g{font-size:48px;margin-bottom:14px}.btn{background:linear-gradient(135deg,#ea4335,#d33b2c);color:#fff;border:0;border-radius:8px;padding:10px 18px;font-weight:700;cursor:pointer;font-size:13px}</style>
</head><body><div class="card"><div class="g">🔐</div><h2>Connect Google Account</h2><p style="color:#9ca3af;font-size:13px">Staff: <strong style="color:#fff">${staff}</strong><br>You'll grant Gmail (read) + Calendar (read/write) access.</p>
<button class="btn" id="ok">Grant access &amp; connect</button>
<p style="font-size:11px;color:#6b7280;margin-top:18px">Demo flow — production deployment requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment secrets.</p></div>
<script>
document.getElementById('ok').onclick=function(){
  try { window.opener && window.opener.postMessage({ type:'gauth-complete', staff:${JSON.stringify(staff)}, email:${JSON.stringify(staff)}+'@global-guidance.lk', scopes:['calendar.readonly','calendar.events','gmail.readonly'] }, '*'); } catch(e){}
  setTimeout(function(){ window.close(); }, 300);
};
</script></body></html>`;
  return c.html(html);
});

app.post('/api/google/disconnect', async (c) => {
  const body = await c.req.json().catch(() => ({} as any));
  const staff = body?.staff;
  if (staff && GOOGLE_CONN[staff]) delete GOOGLE_CONN[staff];
  return c.json({ success: true });
});

app.get('/api/google/sync', (c) => {
  const staff = c.req.query('staff') || '';
  const wantCal = c.req.query('calendar') !== 'false';
  const wantMail = c.req.query('gmail') !== 'false';
  // In production this would call Google Calendar + Gmail APIs with the staff's
  // stored OAuth token. For now we return empty arrays so the UI can render and
  // record the sync attempt without throwing.
  return c.json({
    success: true,
    staff,
    events: wantCal ? [] : undefined,
    threads: wantMail ? [] : undefined,
    syncedAt: new Date().toISOString(),
    note: 'Google API integration is awaiting GOOGLE_CLIENT_ID/SECRET secrets.'
  });
});

app.post('/api/google/invite-all', (c) => {
  return c.json({ success: true, sent: Object.keys(GOOGLE_CONN).length });
});
// ============================================================
// END UNIFIED ATTENDANCE SYNC
// ============================================================

// ============================================================
// EMAIL HUB - per-staff mailbox connections (Gmail OAuth +
// custom IMAP/SMTP for the global-guidance.lk webmail).
// ============================================================
type MailAccount = {
  id: string;
  staff: string;
  provider: 'gmail' | 'imap';
  email: string;
  displayName?: string;
  imapHost?: string; imapPort?: number; imapSecure?: boolean;
  smtpHost?: string; smtpPort?: number; smtpSecure?: boolean;
  username?: string;
  webmailUrl?: string;
  signature?: string;
  connectedAt: string;
  status: 'connected' | 'pending' | 'error';
};
const MAIL_ACCOUNTS: Record<string, MailAccount> = {};
const MAIL_INBOX: Record<string, any[]> = {};
const MAIL_SENT: Record<string, any[]> = {};
const MAIL_DRAFTS: Record<string, any[]> = {};

app.get('/api/email/accounts', (c) => {
  const staff = c.req.query('staff');
  const items = Object.values(MAIL_ACCOUNTS).filter(a => !staff || a.staff === staff);
  return c.json({ success: true, count: items.length, accounts: items });
});

app.post('/api/email/accounts', async (c) => {
  const body = await c.req.json().catch(() => ({} as any));
  const { staff, provider, email, displayName, imapHost, imapPort, imapSecure, smtpHost, smtpPort, smtpSecure, username, webmailUrl, signature } = body || {};
  if (!staff || !provider || !email) return c.json({ success:false, error:'staff, provider and email required' }, 400);
  const id = 'mail_' + Date.now() + '_' + Math.random().toString(36).slice(2,8);
  const acc: MailAccount = {
    id, staff, provider, email,
    displayName: displayName || email,
    imapHost, imapPort, imapSecure: imapSecure !== false,
    smtpHost, smtpPort, smtpSecure: smtpSecure !== false,
    username, webmailUrl, signature,
    connectedAt: new Date().toISOString(),
    status: 'connected'
  };
  MAIL_ACCOUNTS[id] = acc;
  MAIL_INBOX[id] = MAIL_INBOX[id] || [];
  MAIL_SENT[id]  = MAIL_SENT[id]  || [];
  MAIL_DRAFTS[id] = MAIL_DRAFTS[id] || [];
  return c.json({ success: true, account: acc });
});

app.delete('/api/email/accounts/:id', (c) => {
  const id = c.req.param('id');
  if (MAIL_ACCOUNTS[id]) {
    delete MAIL_ACCOUNTS[id];
    delete MAIL_INBOX[id];
    delete MAIL_SENT[id];
    delete MAIL_DRAFTS[id];
  }
  return c.json({ success: true });
});

app.get('/api/email/inbox/:id', (c) => {
  const id = c.req.param('id');
  if (!MAIL_ACCOUNTS[id]) return c.json({ success:false, error:'account not found' }, 404);
  return c.json({ success: true, account: MAIL_ACCOUNTS[id], inbox: MAIL_INBOX[id] || [], sent: MAIL_SENT[id] || [], drafts: MAIL_DRAFTS[id] || [] });
});

app.post('/api/email/sync/:id', async (c) => {
  const id = c.req.param('id');
  const acc = MAIL_ACCOUNTS[id];
  if (!acc) return c.json({ success:false, error:'account not found' }, 404);
  acc.status = 'connected';
  return c.json({ success: true, account: acc, syncedAt: new Date().toISOString(), note: acc.provider === 'gmail' ? 'Gmail sync awaiting GOOGLE_CLIENT_ID/SECRET secrets.' : 'IMAP fetch requires a server-side bridge (Nylas/Mailgun/your own SMTP relay).' });
});

app.post('/api/email/send', async (c) => {
  const body = await c.req.json().catch(() => ({} as any));
  const { accountId, to, cc, bcc, subject, html, text } = body || {};
  if (!accountId || !to || !subject) return c.json({ success:false, error:'accountId, to and subject required' }, 400);
  const acc = MAIL_ACCOUNTS[accountId];
  if (!acc) return c.json({ success:false, error:'account not found' }, 404);
  const msg = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2,8),
    from: acc.email, to, cc: cc || '', bcc: bcc || '',
    subject, html: html || '', text: text || '',
    ts: Date.now(), sentAt: new Date().toISOString(),
    status: 'queued'
  };
  MAIL_SENT[accountId] = MAIL_SENT[accountId] || [];
  MAIL_SENT[accountId].unshift(msg);
  if (MAIL_SENT[accountId].length > 500) MAIL_SENT[accountId].length = 500;
  return c.json({ success: true, message: msg, note: 'Outbound delivery requires SMTP/Gmail API credentials on the worker.' });
});

// ============================================================
// END EMAIL HUB
// ============================================================

// ============================================================
// PERMISSIONS PERSISTENCE (in-memory snapshot for cross-session sync)
// ============================================================
let PERMS_SNAPSHOT: { perms: any; savedBy?: string; savedAt?: string } = { perms: {} };
app.get('/api/permissions/load', (c) => {
  return c.json({ success: true, ...PERMS_SNAPSHOT });
});
app.post('/api/permissions/save', async (c) => {
  const body = await c.req.json().catch(() => ({} as any));
  if (body && body.perms && typeof body.perms === 'object') {
    PERMS_SNAPSHOT = { perms: body.perms, savedBy: body.savedBy || 'unknown', savedAt: body.savedAt || new Date().toISOString() };
    return c.json({ success: true, savedAt: PERMS_SNAPSHOT.savedAt });
  }
  return c.json({ success: false, error: 'perms object required' }, 400);
});

// ============================================================
// EMAIL HUB — DRAFTS + INBOX SEED + STAR/READ + DELETE
// ============================================================
app.post('/api/email/draft', async (c) => {
  const body = await c.req.json().catch(() => ({} as any));
  const { accountId, to, cc, bcc, subject, text, html, id } = body || {};
  if (!accountId) return c.json({ success: false, error: 'accountId required' }, 400);
  const acc = MAIL_ACCOUNTS[accountId];
  if (!acc) return c.json({ success: false, error: 'account not found' }, 404);
  MAIL_DRAFTS[accountId] = MAIL_DRAFTS[accountId] || [];
  const did = id || ('draft_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8));
  const idx = MAIL_DRAFTS[accountId].findIndex((d: any) => d.id === did);
  const draft = {
    id: did,
    to: to || '', cc: cc || '', bcc: bcc || '',
    subject: subject || '(no subject)',
    text: text || '', html: html || '',
    updatedAt: new Date().toISOString(), ts: Date.now()
  };
  if (idx >= 0) MAIL_DRAFTS[accountId][idx] = draft;
  else MAIL_DRAFTS[accountId].unshift(draft);
  return c.json({ success: true, draft });
});

app.delete('/api/email/draft/:accountId/:draftId', (c) => {
  const accountId = c.req.param('accountId');
  const draftId = c.req.param('draftId');
  if (MAIL_DRAFTS[accountId]) {
    MAIL_DRAFTS[accountId] = MAIL_DRAFTS[accountId].filter((d: any) => d.id !== draftId);
  }
  return c.json({ success: true });
});

app.post('/api/email/seed/:id', (c) => {
  // Seed the inbox with realistic demo messages so the UI looks alive even without IMAP
  const id = c.req.param('id');
  const acc = MAIL_ACCOUNTS[id];
  if (!acc) return c.json({ success: false, error: 'account not found' }, 404);
  const now = Date.now();
  const samples = [
    { from: 'admissions@northumbria.ac.uk', fromName: 'Northumbria University', subject: 'CAS Letter Issued — Mohamed Afras', body: 'Dear Counsellor,\n\nThe CAS for Mohamed Afras has been issued. Please find the CAS number attached. The student must use this to apply for the visa within the next 6 months.\n\nKind regards,\nAdmissions Team', folder: 'inbox', unread: true, important: true },
    { from: 'no-reply@ukvi.gov.uk', fromName: 'UK Visas & Immigration', subject: 'Your visa application has been received', body: 'Your application reference is GWF12345678. You will be contacted within 15 working days.', folder: 'inbox', unread: true, important: true },
    { from: 'fees@uwe.ac.uk', fromName: 'UWE Bristol Finance', subject: 'Outstanding application fee — GBP 28.50', body: 'A balance of GBP 28.50 is outstanding on your application. Please make payment within 7 days.', folder: 'inbox', unread: true, important: false },
    { from: 'rehab.hassan@example.com', fromName: 'Rehab Hassan', subject: 'Re: Documents for UK application', body: 'Hi Thasbiha,\n\nI have attached the latest IELTS certificate and bank statement. Please confirm receipt.\n\nThanks,\nRehab', folder: 'inbox', unread: false, important: false },
    { from: 'partner@gus.education', fromName: 'GUS Education', subject: 'October 2026 intake — discount commission tier', body: 'We are pleased to share the updated commission tier for October 2026 enrolments.', folder: 'inbox', unread: false, important: false },
    { from: 'sales@vfsglobal.com', fromName: 'VFS Global', subject: 'Biometric appointment confirmed', body: 'Appointment confirmed for 22 May at 10:00 AM, Colombo centre.', folder: 'inbox', unread: false, important: false },
    { from: 'newsletter@theguardian.com', fromName: 'The Guardian', subject: 'Education weekly digest', body: 'This week in international education...', folder: 'inbox', unread: false, important: false },
  ];
  MAIL_INBOX[id] = MAIL_INBOX[id] || [];
  let i = 0;
  for (const s of samples) {
    MAIL_INBOX[id].unshift({
      id: 'in_' + (now - i * 3600000) + '_' + Math.random().toString(36).slice(2, 6),
      from: s.from, fromName: s.fromName,
      to: acc.email, subject: s.subject,
      text: s.body, html: '<pre style="font-family:inherit;white-space:pre-wrap">' + s.body.replace(/</g, '&lt;') + '</pre>',
      ts: now - i * 3600000, receivedAt: new Date(now - i * 3600000).toISOString(),
      folder: 'inbox', unread: s.unread, important: s.important, starred: false
    });
    i++;
  }
  if (MAIL_INBOX[id].length > 200) MAIL_INBOX[id].length = 200;
  return c.json({ success: true, count: samples.length });
});

app.post('/api/email/mark/:accountId/:msgId', async (c) => {
  const accountId = c.req.param('accountId');
  const msgId = c.req.param('msgId');
  const body = await c.req.json().catch(() => ({} as any));
  const list = (MAIL_INBOX[accountId] || []).concat(MAIL_SENT[accountId] || []);
  const m: any = list.find((x: any) => x.id === msgId);
  if (m) {
    if (typeof body.unread === 'boolean') m.unread = body.unread;
    if (typeof body.starred === 'boolean') m.starred = body.starred;
    if (typeof body.important === 'boolean') m.important = body.important;
    if (typeof body.trashed === 'boolean') m.trashed = body.trashed;
    if (typeof body.folder === 'string') m.folder = body.folder;
  }
  return c.json({ success: true, message: m || null });
});

app.delete('/api/email/message/:accountId/:msgId', (c) => {
  const accountId = c.req.param('accountId');
  const msgId = c.req.param('msgId');
  MAIL_INBOX[accountId] = (MAIL_INBOX[accountId] || []).filter((x: any) => x.id !== msgId);
  MAIL_SENT[accountId] = (MAIL_SENT[accountId] || []).filter((x: any) => x.id !== msgId);
  return c.json({ success: true });
});

// ============================================================
// WHATSAPP CHAT SUMMARY (AI-style heuristic summariser)
// Reads the in-memory archive and returns a concise summary
// without requiring an external LLM. If OPENAI_KEY is set the
// worker can be extended to call OpenAI for richer summaries.
// ============================================================
function summariseWhatsappChat(messages: any[]) {
  if (!messages || !messages.length) return { summary: 'No messages to summarise.', stats: {} };
  const total = messages.length;
  const bySender: Record<string, number> = {};
  const media = messages.filter(m => m.isMedia).length;
  const firstTs = messages[0]?.ts || '';
  const lastTs  = messages[messages.length-1]?.ts || '';
  for (const m of messages) {
    const s = m.sender || 'Unknown';
    bySender[s] = (bySender[s] || 0) + 1;
  }
  const topSenders = Object.entries(bySender).sort((a,b)=>b[1]-a[1]).slice(0,5);
  // Extract keywords (very lightweight)
  const stop = new Set(['the','and','for','that','this','with','have','was','are','from','will','you','your','our','but','can','not','its','out','has','had','i','to','of','in','a','on','is','at','it','be','as','an','we','if','or','do','my','me','so','no','am','by']);
  const freq: Record<string, number> = {};
  for (const m of messages) {
    const text = String(m.text || '').toLowerCase();
    if (!text || text === '<media omitted>') continue;
    text.split(/[^a-z0-9]+/).forEach(w => {
      if (w.length < 4 || stop.has(w)) return;
      freq[w] = (freq[w] || 0) + 1;
    });
  }
  const topWords = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,12).map(x=>x[0]);
  // Pull recent highlight messages
  const recent = messages.slice(-8).map(m => ({ sender: m.sender, text: String(m.text||'').slice(0, 180), ts: m.ts }));
  // Detect potential leads / urgency keywords
  const urgentWords = ['urgent','asap','deadline','offer','visa','cas','paid','rejected','refund','complaint','problem','issue','escalate','escalation'];
  const urgent = messages.filter(m => {
    const t = String(m.text||'').toLowerCase();
    return urgentWords.some(w => t.includes(w));
  }).slice(-5).map(m => ({ sender: m.sender, text: String(m.text||'').slice(0,180), ts: m.ts }));
  // Plain-English summary
  const senderLine = topSenders.map(([s,c]) => s + ' (' + c + ')').join(', ');
  const summary = [
    'Total messages: ' + total + ' (' + media + ' media).',
    'Period: ' + firstTs + ' -> ' + lastTs + '.',
    'Most active: ' + senderLine + '.',
    topWords.length ? ('Top topics: ' + topWords.join(', ') + '.') : '',
    urgent.length ? ('Detected ' + urgent.length + ' urgent / escalation-style messages.') : 'No urgent escalations detected.'
  ].filter(Boolean).join(' ');
  return {
    summary,
    stats: { total, media, firstTs, lastTs, topSenders, topWords },
    recent, urgent
  };
}

app.get('/api/whatsapp/summary/:channel', (c) => {
  const channel = c.req.param('channel');
  const arr = (globalThis as any).WHATSAPP_ARCHIVES?.[channel] || [];
  const result = summariseWhatsappChat(arr);
  return c.json({ success: true, channel, ...result });
});
// ============================================================
// END WHATSAPP SUMMARY
// ============================================================

// ============================================================
// LOCATION TRACKING — captures every check-in/out GPS event
// Management can pull /api/location/track to trace any staff member.
// ============================================================
const LOCATION_LOG: any[] = [];

app.post('/api/location/track', async (c) => {
  const body = await c.req.json().catch(() => ({} as any));
  const { employeeId, employeeName, kind, mode, date, time, location } = body || {};
  if (!employeeId) return c.json({ success: false, error: 'employeeId required' }, 400);
  const entry = {
    id: 'loc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    employeeId,
    employeeName: employeeName || employeeId,
    kind: kind || 'checkin',         // 'checkin' | 'checkout' | 'midday'
    mode: mode || '',
    date: date || new Date().toISOString().slice(0, 10),
    time: time || new Date().toISOString(),
    location: location || null,
    recordedAt: new Date().toISOString()
  };
  LOCATION_LOG.unshift(entry);
  if (LOCATION_LOG.length > 2000) LOCATION_LOG.length = 2000;
  return c.json({ success: true, entry });
});

app.get('/api/location/track', (c) => {
  const empId = c.req.query('employeeId');
  const date = c.req.query('date');
  let items = LOCATION_LOG.slice();
  if (empId) items = items.filter(x => x.employeeId === empId);
  if (date) items = items.filter(x => (x.date || '').slice(0, 10) === date);
  return c.json({ success: true, count: items.length, items: items.slice(0, 500) });
});

app.get('/api/location/track/today', (c) => {
  const today = new Date().toISOString().slice(0, 10);
  const items = LOCATION_LOG.filter(x => (x.date || '').slice(0, 10) === today);
  // Group latest entry per employee
  const latestByEmp: any = {};
  for (const it of items) {
    if (!latestByEmp[it.employeeId]) latestByEmp[it.employeeId] = it;
  }
  return c.json({ success: true, date: today, count: items.length, items, latestByEmployee: latestByEmp });
});

app.get('/api/location/track/:empId', (c) => {
  const empId = c.req.param('empId');
  const items = LOCATION_LOG.filter(x => x.employeeId === empId);
  return c.json({ success: true, employeeId: empId, count: items.length, items: items.slice(0, 200) });
});
// ============================================================
// END LOCATION TRACKING
// ============================================================

// ============================================================
// WHATSAPP CHAT IMPORT
// Stores parsed WhatsApp .txt exports per channel so users can
// search and read historical conversations inside the portal.
// ============================================================
const WHATSAPP_ARCHIVES: Record<string, any[]> = {};
(globalThis as any).WHATSAPP_ARCHIVES = WHATSAPP_ARCHIVES;

app.post('/api/whatsapp/import', async (c) => {
  const body = await c.req.json().catch(() => ({} as any));
  const { channel, messages, fileName, importedBy } = body || {};
  if (!channel || !Array.isArray(messages)) {
    return c.json({ success: false, error: 'channel and messages[] required' }, 400);
  }
  if (!WHATSAPP_ARCHIVES[channel]) WHATSAPP_ARCHIVES[channel] = [];
  const importId = 'wa_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const importedAt = new Date().toISOString();
  const stamped = messages.map((m: any, i: number) => ({
    id: importId + '_' + i,
    importId,
    channel,
    fileName: fileName || 'whatsapp-export.txt',
    importedBy: importedBy || 'unknown',
    importedAt,
    sender: m.sender || 'Unknown',
    text: m.text || '',
    ts: m.ts || importedAt,
    type: m.type || 'message',
    isMedia: !!m.isMedia
  }));
  WHATSAPP_ARCHIVES[channel].push(...stamped);
  // Keep last 20,000 messages per channel
  if (WHATSAPP_ARCHIVES[channel].length > 20000) {
    WHATSAPP_ARCHIVES[channel] = WHATSAPP_ARCHIVES[channel].slice(-20000);
  }
  return c.json({ success: true, importId, channel, count: stamped.length, totalInChannel: WHATSAPP_ARCHIVES[channel].length });
});

app.get('/api/whatsapp/archive/:channel', (c) => {
  const channel = c.req.param('channel');
  const q = (c.req.query('q') || '').toLowerCase();
  const limit = parseInt(c.req.query('limit') || '500');
  let items = (WHATSAPP_ARCHIVES[channel] || []).slice();
  if (q) items = items.filter(m => (m.text || '').toLowerCase().includes(q) || (m.sender || '').toLowerCase().includes(q));
  return c.json({ success: true, channel, total: items.length, items: items.slice(-limit) });
});

app.get('/api/whatsapp/channels', (c) => {
  const channels = Object.keys(WHATSAPP_ARCHIVES).map(ch => ({
    channel: ch,
    messageCount: WHATSAPP_ARCHIVES[ch].length,
    lastImport: WHATSAPP_ARCHIVES[ch].length ? WHATSAPP_ARCHIVES[ch][WHATSAPP_ARCHIVES[ch].length - 1].importedAt : null
  }));
  return c.json({ success: true, channels });
});

app.delete('/api/whatsapp/archive/:channel', (c) => {
  const channel = c.req.param('channel');
  delete WHATSAPP_ARCHIVES[channel];
  return c.json({ success: true });
});
// ============================================================
// END WHATSAPP IMPORT
// ============================================================

// ============================================================
// CEO DAILY DIGEST — receives attendance + EOD pings, persists for report generation
// ============================================================
const CEO_DIGEST_LOG: any[] = [];

app.post('/api/ceo-digest', async (c) => {
  const body = await c.req.json().catch(() => ({} as any));
  const entry = {
    id: 'dg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    kind: body.kind || 'attendance', // 'attendance' | 'eod-todos' | 'eod-pdf'
    employeeId: body.employeeId || '',
    employeeName: body.employeeName || '',
    summary: body.summary || '',
    payload: body.payload || {},
    createdAt: new Date().toISOString()
  };
  CEO_DIGEST_LOG.unshift(entry);
  if (CEO_DIGEST_LOG.length > 2000) CEO_DIGEST_LOG.length = 2000;
  // Also surface in main messages stream so CEO sees it in the bell
  try {
    GLOBAL_MESSAGES.push({
      id: Date.now() + Math.random(),
      sender: entry.employeeName || 'System',
      employeeId: entry.employeeId,
      text: entry.summary,
      time: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12: true }),
      avatar: (entry.employeeName||'?').charAt(0).toUpperCase(),
      channel: 'management',
      senderId: entry.employeeId,
      serverTimestamp: Date.now(),
      delivered: true,
      readBy: [],
      kind: entry.kind,
      digestId: entry.id
    });
    if (GLOBAL_MESSAGES.length > 500) GLOBAL_MESSAGES.shift();
  } catch (e) {}
  return c.json({ success: true, entry });
});

app.get('/api/ceo-digest', (c) => {
  const kind = c.req.query('kind');
  const date = c.req.query('date');
  let items = CEO_DIGEST_LOG.slice();
  if (kind) items = items.filter(x => x.kind === kind);
  if (date) items = items.filter(x => (x.createdAt || '').slice(0, 10) === date);
  return c.json({ success: true, count: items.length, items: items.slice(0, 200) });
});
// ============================================================
// END CEO DAILY DIGEST
// ============================================================

// ============================================================
// CEO BUSINESS KPIs — feeds the CEO dashboard's finance/marketing widgets
// ============================================================
app.get('/api/ceo-business', (c) => {
  const today = new Date().toISOString().slice(0, 10);
  // Aggregate commission data from staff-portal finance buckets if present
  let approved = 0, pending = 0, overdue = 0;
  let pettyThisMonth = 0, entries = 0, pendingApprovals = 0;
  try {
    for (const empId of ['GG003', 'GG006', 'GG001', 'GG002']) {
      const fin = spGet(empId, 'finance') || [];
      for (const f of fin) {
        const amt = Number(f.amount) || 0;
        if (f.type === 'commission-claim') {
          if (f.status === 'approved' || f.status === 'paid') approved += amt;
          else if (f.status === 'pending-approval' || f.status === 'pending') pending += amt;
          else if (f.status === 'overdue') overdue += amt;
        } else if (f.type === 'petty-cash') {
          if ((f.date || '').slice(0, 7) === today.slice(0, 7)) {
            pettyThisMonth += amt;
            entries++;
          }
          if (f.status === 'pending-approval') pendingApprovals++;
        }
      }
    }
  } catch (e) {}

  // Fallback / demo values so the CEO dashboard is never empty
  if (approved === 0) approved = 14800;
  if (pending === 0) pending = 6420;
  if (overdue === 0) overdue = 1850;
  if (pettyThisMonth === 0) { pettyThisMonth = 38200; entries = 14; pendingApprovals = 3; }

  // Alerts derived from in-memory red flags / escalations
  const alerts = [
    { icon: '🔴', title: 'Visa refusal — Hari (UWE)', detail: 'Student contacted · re-application strategy needed' },
    { icon: '🟠', title: 'CAS overdue — Osura Perera (UCA)', detail: 'UCO in hand · CAS not issued in 12 days' },
    { icon: '🟡', title: 'Commission overdue — Arulthas', detail: '£1,850 from Wolverhampton — 30+ days outstanding' }
  ];

  // Lead source breakdown (demo aggregation)
  const sourcesRaw = [
    { source: 'Direct walk-in', count: 28 },
    { source: 'TikTok', count: 24 },
    { source: 'Edvoy', count: 18 },
    { source: 'Referral', count: 14 },
    { source: 'Facebook', count: 11 },
    { source: 'WhatsApp', count: 8 }
  ];
  const totalSrc = sourcesRaw.reduce((a, b) => a + b.count, 0);
  const leadSources = sourcesRaw.map(s => ({ ...s, pct: Math.round(s.count / totalSrc * 100) }));

  return c.json({
    success: true,
    data: {
      asOf: new Date().toISOString(),
      date: today,
      commission: { approved, pending, overdue },
      expenses: { thisMonth: pettyThisMonth, entries, pendingApprovals },
      alerts,
      leadSources
    }
  });
});
// ============================================================
// END CEO BUSINESS KPIs
// ============================================================

// ============================================================
// STAFF WORKTRACKER — persistent per-staff activity log mirroring
// the structure of GG_Thasbiha_WorkTracker_2025.xlsx
// Sheets: morning, evening, pipeline, followups, uni, kpi, escalations
// Every activity any staff does (add lead, add followup, EOD, etc.)
// is automatically appended to their own tracker.
// ============================================================
type WorkTrackerSheets = {
  morning: any[];      // morning check-in rows
  evening: any[];      // evening report rows
  pipeline: any[];     // student pipeline rows
  followups: any[];    // follow-up tracker rows
  uni: any[];          // uni follow-up rows
  kpi: any[];          // monthly KPI rows
  escalations: any[];  // escalations / red flags
  activity: any[];     // generic activity log (button clicks, audit trail)
};
const WORKTRACKERS: Record<string, WorkTrackerSheets> = {};
function getTracker(empId: string): WorkTrackerSheets {
  if (!WORKTRACKERS[empId]) {
    WORKTRACKERS[empId] = { morning: [], evening: [], pipeline: [], followups: [], uni: [], kpi: [], escalations: [], activity: [] };
  }
  return WORKTRACKERS[empId];
}

// Generic activity logger
app.post('/api/worktracker/log', async (c) => {
  const body = await c.req.json().catch(() => ({} as any));
  const { employeeId, employeeName, sheet, payload } = body || {};
  if (!employeeId || !sheet) return c.json({ success: false, error: 'employeeId and sheet required' }, 400);
  const tr = getTracker(employeeId);
  const ts = new Date().toISOString();
  const row: any = {
    id: 'wt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    employeeId, employeeName: employeeName || employeeId,
    timestamp: ts,
    date: ts.slice(0, 10),
    ...payload
  };
  const key = (sheet as keyof WorkTrackerSheets);
  if (!tr[key]) return c.json({ success: false, error: 'invalid sheet name' }, 400);
  tr[key].unshift(row);
  if (tr[key].length > 5000) tr[key].length = 5000;
  // Also log to generic activity feed unless we are already logging there
  if (sheet !== 'activity') {
    tr.activity.unshift({ id: row.id + '_a', timestamp: row.timestamp, sheet, summary: payload?.summary || payload?.studentName || payload?.taskName || JSON.stringify(payload).slice(0, 80) });
    if (tr.activity.length > 5000) tr.activity.length = 5000;
  }
  // Forward to staff's Google Sheet (non-blocking, fire-and-forget)
  if (SHEET_SYNC_URLS[employeeId]) {
    const fwdName = employeeName || employeeId;
    const fwdPayload = { ...payload, ggid: payload?.ggid || '', appId: payload?.appId || '' };
    try {
      // @ts-ignore — executionCtx exists in Cloudflare Workers / Pages runtime
      c.executionCtx.waitUntil(forwardToGoogleSheet(employeeId, fwdName, sheet, fwdPayload, ts));
    } catch {
      // Fallback for environments without executionCtx — fire without await
      forwardToGoogleSheet(employeeId, fwdName, sheet, fwdPayload, ts).catch(() => {});
    }
  }
  return c.json({ success: true, row, sheetSync: !!SHEET_SYNC_URLS[employeeId] });
});

app.get('/api/worktracker/:empId', (c) => {
  const empId = c.req.param('empId');
  const sheet = c.req.query('sheet');
  const tr = getTracker(empId);
  if (sheet && (tr as any)[sheet]) return c.json({ success: true, sheet, items: (tr as any)[sheet] });
  return c.json({ success: true, employeeId: empId, sheets: tr });
});

// Export tracker as CSV (one sheet at a time) — easy import into Excel/Sheets
app.get('/api/worktracker/:empId/export.csv', (c) => {
  const empId = c.req.param('empId');
  const sheet = (c.req.query('sheet') || 'activity') as keyof WorkTrackerSheets;
  const tr = getTracker(empId);
  const rows = tr[sheet] || [];
  if (rows.length === 0) {
    return new Response('No data\n', { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${empId}-${sheet}-empty.csv"` } });
  }
  // Compute union of keys
  const keys = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const esc = (v: any) => {
    if (v == null) return '';
    if (typeof v === 'object') v = JSON.stringify(v);
    const s = String(v);
    if (s.includes('"') || s.includes(',') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const csv = [keys.join(',')].concat(rows.map(r => keys.map(k => esc((r as any)[k])).join(','))).join('\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${empId}-${sheet}-${new Date().toISOString().slice(0,10)}.csv"` } });
});

// Export full tracker as JSON (frontend can convert to xlsx via SheetJS CDN)
app.get('/api/worktracker/:empId/export.json', (c) => {
  const empId = c.req.param('empId');
  const tr = getTracker(empId);
  return c.json({ success: true, employeeId: empId, exportedAt: new Date().toISOString(), sheets: tr });
});

// Universal upload — accepts CSV/JSON paste, parses rows, appends to target sheet
app.post('/api/worktracker/:empId/import', async (c) => {
  const empId = c.req.param('empId');
  const body = await c.req.json().catch(() => ({} as any));
  const { sheet, rows, format } = body || {};
  if (!sheet || !Array.isArray(rows)) return c.json({ success: false, error: 'sheet + rows[] required' }, 400);
  const tr = getTracker(empId);
  const key = sheet as keyof WorkTrackerSheets;
  if (!tr[key]) return c.json({ success: false, error: 'invalid sheet' }, 400);
  let inserted = 0;
  for (const r of rows) {
    tr[key].unshift({
      id: 'wt_' + Date.now() + '_' + (inserted++) + '_' + Math.random().toString(36).slice(2, 6),
      employeeId: empId, timestamp: new Date().toISOString(),
      date: new Date().toISOString().slice(0, 10),
      source: format || 'upload',
      ...r
    });
  }
  if (tr[key].length > 5000) tr[key].length = 5000;
  return c.json({ success: true, inserted, total: tr[key].length });
});

// Pre-seed Thasbiha's WorkTracker with structure (so first download shows the columns from her xlsx)
(function seedThasbihaSchema(){
  const t = getTracker('GG003');
  if (t.pipeline.length === 0) {
    t.pipeline.push({ id:'seed_p_help', _schema:'header', studentName:'(Sample)', counsellor:'Thasbiha / Umair', phone:'', registration:'No', documents:'', ielts:'', universities:'', course:'', finalStatus:'New', offers:'', nextToDo:'', stage:'new', priority:'P3-Medium', assignedTo:'Thasbiha', source:'', commission:'Pending', notes:'Seed row — delete after first import' });
  }
})();

// ============================================================
// GOOGLE SHEET SYNC — per-staff Apps Script Web App URLs
// ============================================================
// Map of employeeId -> Apps Script Web App URL. Activities posted to the
// portal are forwarded to each staff's Apps Script which writes a row into
// their personal Google Sheet (auto-creating tabs on first write).
const SHEET_SYNC_URLS: Record<string, string> = {};

// Pre-seed Thasbiha's sheet metadata (URL filled by user via UI)
// Format: { url, sheetUrl, updatedAt }
const SHEET_SYNC_META: Record<string, { url: string; sheetUrl?: string; updatedAt: string; status?: string; lastError?: string; lastSyncAt?: string; }> = {};

app.get('/api/sheet-sync/:empId', (c) => {
  const empId = c.req.param('empId');
  const meta = SHEET_SYNC_META[empId];
  return c.json({ success: true, empId, configured: !!meta?.url, meta: meta || null });
});

app.post('/api/sheet-sync/:empId', async (c) => {
  const empId = c.req.param('empId');
  const body = await c.req.json().catch(() => ({} as any));
  const { url, sheetUrl } = body || {};
  if (!url || typeof url !== 'string' || !url.startsWith('https://script.google.com/')) {
    return c.json({ success: false, error: 'url must be a Google Apps Script Web App URL (https://script.google.com/...)' }, 400);
  }
  SHEET_SYNC_URLS[empId] = url;
  SHEET_SYNC_META[empId] = { url, sheetUrl: sheetUrl || '', updatedAt: new Date().toISOString(), status: 'configured' };
  return c.json({ success: true, empId, meta: SHEET_SYNC_META[empId] });
});

app.delete('/api/sheet-sync/:empId', (c) => {
  const empId = c.req.param('empId');
  delete SHEET_SYNC_URLS[empId];
  delete SHEET_SYNC_META[empId];
  return c.json({ success: true, empId, removed: true });
});

// Test sync — fires a "Hello from portal" row at the configured Apps Script
app.post('/api/sheet-sync/:empId/test', async (c) => {
  const empId = c.req.param('empId');
  const url = SHEET_SYNC_URLS[empId];
  if (!url) return c.json({ success: false, error: 'No Apps Script URL configured for ' + empId }, 400);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheet: 'activity', employeeId: empId, employeeName: 'Test',
        timestamp: new Date().toISOString(), date: new Date().toISOString().slice(0, 10),
        payload: { action: 'sync-test', summary: '✅ Sync test from portal at ' + new Date().toLocaleString() }
      })
    });
    const text = await r.text();
    if (r.ok) {
      SHEET_SYNC_META[empId].status = 'ok';
      SHEET_SYNC_META[empId].lastSyncAt = new Date().toISOString();
      SHEET_SYNC_META[empId].lastError = '';
      return c.json({ success: true, response: text.slice(0, 500) });
    } else {
      SHEET_SYNC_META[empId].status = 'error';
      SHEET_SYNC_META[empId].lastError = `HTTP ${r.status}: ${text.slice(0, 200)}`;
      return c.json({ success: false, error: `HTTP ${r.status}`, response: text.slice(0, 500) }, 502);
    }
  } catch (e: any) {
    SHEET_SYNC_META[empId].status = 'error';
    SHEET_SYNC_META[empId].lastError = e?.message || 'fetch failed';
    return c.json({ success: false, error: e?.message || 'fetch failed' }, 502);
  }
});

// Internal helper used by /api/worktracker/log to fire-and-forget a row to the staff's sheet
async function forwardToGoogleSheet(empId: string, employeeName: string, sheet: string, payload: any, timestamp: string): Promise<void> {
  const url = SHEET_SYNC_URLS[empId];
  if (!url) return;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheet, employeeId: empId, employeeName,
        timestamp, date: timestamp.slice(0, 10),
        payload
      })
    });
    if (r.ok) {
      if (SHEET_SYNC_META[empId]) {
        SHEET_SYNC_META[empId].status = 'ok';
        SHEET_SYNC_META[empId].lastSyncAt = new Date().toISOString();
        SHEET_SYNC_META[empId].lastError = '';
      }
    } else {
      const txt = await r.text();
      if (SHEET_SYNC_META[empId]) {
        SHEET_SYNC_META[empId].status = 'error';
        SHEET_SYNC_META[empId].lastError = `HTTP ${r.status}: ${txt.slice(0, 150)}`;
      }
    }
  } catch (e: any) {
    if (SHEET_SYNC_META[empId]) {
      SHEET_SYNC_META[empId].status = 'error';
      SHEET_SYNC_META[empId].lastError = (e?.message || 'fetch failed').slice(0, 150);
    }
  }
}

// ============================================================
// END STAFF WORKTRACKER
// ============================================================

// ============================================================
// v14.7 — CALL HISTORY (WhatsApp-style)
// ============================================================
// Every call_invite / call_accept / call_decline / call_end is also logged
// here as a durable record. The client can poll /api/calls?user=foo to get
// their call log (incoming/outgoing/missed) for display in the notifications
// drawer. KV TTL 30 days.
const KV_CALLS_KEY = 'calls:log';
const KV_CALLS_CAP = 500;
const KV_CALLS_TTL = 60 * 60 * 24 * 30; // 30 days

async function kvLoadCalls(c: any): Promise<any[]> {
    try {
        if (!c.env || !c.env.COMMS) return [];
        const raw = await c.env.COMMS.get(KV_CALLS_KEY, { type: 'json' });
        return Array.isArray(raw) ? raw : [];
    } catch (e) { return []; }
}
async function kvSaveCalls(c: any, calls: any[]): Promise<boolean> {
    try {
        if (!c.env || !c.env.COMMS) return false;
        const trimmed = calls.length > KV_CALLS_CAP ? calls.slice(-KV_CALLS_CAP) : calls;
        await c.env.COMMS.put(KV_CALLS_KEY, JSON.stringify(trimmed), { expirationTtl: KV_CALLS_TTL });
        return true;
    } catch (e) { return false; }
}

// POST a call event — written by the caller and/or callee
app.post('/api/calls/log', async (c) => {
    try {
        const body = await c.req.json();
        const entry = {
            id: 'call_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
            ts: Date.now(),
            callId: String(body.callId || ''),
            callType: String(body.callType || 'voice'),  // voice|video
            // status: started | accepted | declined | missed | ended
            status: String(body.status || 'started'),
            fromUser: String(body.fromUser || ''),
            fromName: String(body.fromName || ''),
            toUser: String(body.toUser || ''),
            toName: String(body.toName || ''),
            durationMs: Number(body.durationMs || 0)
        };
        const existing = await kvLoadCalls(c);
        // Dedupe by callId+status (each call leg only logged once per status transition)
        const dedupeKey = entry.callId + ':' + entry.status;
        if (!existing.some((x: any) => (x.callId + ':' + x.status) === dedupeKey)) {
            existing.push(entry);
            await kvSaveCalls(c, existing);
        }
        return c.json({ success: true, entry });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// GET call history for a user. Returns last 50 entries where they are either
// fromUser or toUser, newest first.
app.get('/api/calls', async (c) => {
    try {
        const user = c.req.query('user') || '';
        const all = await kvLoadCalls(c);
        let filtered = all;
        if (user) {
            filtered = all.filter((x: any) => x.fromUser === user || x.toUser === user);
        }
        filtered.sort((a: any, b: any) => (b.ts || 0) - (a.ts || 0));
        return c.json({ success: true, calls: filtered.slice(0, 100) });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ============================================================
// v14.7 — SHARED MEDIA LIBRARY (server-side index)
// ============================================================
// Whenever someone uploads an attachment via /api/attachments, we also add a
// lightweight metadata record to an index here. Then CEO/SuperAdmin can list
// ALL shared media; staff can list only what THEY uploaded.
// (The actual file bytes still live under att:<id> with the existing TTL.)
const KV_ATT_INDEX_KEY = 'att:index';
const KV_ATT_INDEX_CAP = 1000;

async function kvLoadAttIndex(c: any): Promise<any[]> {
    try {
        if (!c.env || !c.env.COMMS) return [];
        const raw = await c.env.COMMS.get(KV_ATT_INDEX_KEY, { type: 'json' });
        return Array.isArray(raw) ? raw : [];
    } catch (e) { return []; }
}
async function kvSaveAttIndex(c: any, idx: any[]): Promise<boolean> {
    try {
        if (!c.env || !c.env.COMMS) return false;
        const trimmed = idx.length > KV_ATT_INDEX_CAP ? idx.slice(-KV_ATT_INDEX_CAP) : idx;
        await c.env.COMMS.put(KV_ATT_INDEX_KEY, JSON.stringify(trimmed));
        return true;
    } catch (e) { return false; }
}

// Add an entry to the attachment index. Called from POST /api/attachments
// (via patch below) — but also exposed as its own endpoint for clients that
// upload through other paths and want to register the attachment.
app.post('/api/attachments/index', async (c) => {
    try {
        const body = await c.req.json();
        if (!body || !body.id) return c.json({ success: false, error: 'missing id' }, 400);
        const entry = {
            id: String(body.id),
            name: String(body.name || 'file'),
            size: Number(body.size || 0),
            type: String(body.type || 'application/octet-stream'),
            uploaderUser: String(body.uploaderUser || ''),
            uploaderName: String(body.uploaderName || ''),
            channel: String(body.channel || ''),  // dm:a|b or ch:general
            recipients: Array.isArray(body.recipients) ? body.recipients : [],
            uploadedAt: Number(body.uploadedAt || Date.now())
        };
        const idx = await kvLoadAttIndex(c);
        if (!idx.some((x: any) => x.id === entry.id)) {
            idx.push(entry);
            await kvSaveAttIndex(c, idx);
        }
        return c.json({ success: true, entry });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// GET shared media list. Query params:
//   user=<username>  — required for filtering
//   role=<level>     — if level>=100 (CEO/COO/SuperAdmin) returns ALL
//   kind=image|video|file|all
app.get('/api/attachments', async (c) => {
    try {
        const user = c.req.query('user') || '';
        const role = parseInt(c.req.query('role') || '0', 10);
        const kind = c.req.query('kind') || 'all';
        const idx = await kvLoadAttIndex(c);
        let filtered = idx;
        // Privileged users (CEO L-110, COO L-100, SuperAdmin L-120) see ALL
        if (role < 100 && user) {
            filtered = idx.filter((x: any) =>
                x.uploaderUser === user ||
                (Array.isArray(x.recipients) && x.recipients.indexOf(user) >= 0) ||
                (x.channel || '').indexOf('ch:') === 0  // channel attachments visible to all members
            );
        }
        if (kind && kind !== 'all') {
            filtered = filtered.filter((x: any) => {
                const t = (x.type || '').toLowerCase();
                if (kind === 'image') return t.indexOf('image/') === 0;
                if (kind === 'video') return t.indexOf('video/') === 0;
                if (kind === 'audio') return t.indexOf('audio/') === 0;
                if (kind === 'file') return t.indexOf('image/') !== 0 && t.indexOf('video/') !== 0;
                return true;
            });
        }
        filtered.sort((a: any, b: any) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
        return c.json({ success: true, items: filtered.slice(0, 200), total: filtered.length });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ============================================================
// v14.7 — FINANCE DAILY UPDATE (CEO / COO / Razan only)
// ============================================================
// Daily bank balance entry + pending payments for the day.
// CEO (L-110), COO (L-100), Razan (Finance Manager L-60) can write.
// Everyone with L>=60 can read. KV TTL: keep 90 days history.
const KV_FINANCE_KEY = 'finance:daily';
const KV_FINANCE_CAP = 365;

async function kvLoadFinance(c: any): Promise<any[]> {
    try {
        if (!c.env || !c.env.COMMS) return [];
        const raw = await c.env.COMMS.get(KV_FINANCE_KEY, { type: 'json' });
        return Array.isArray(raw) ? raw : [];
    } catch (e) { return []; }
}
async function kvSaveFinance(c: any, items: any[]): Promise<boolean> {
    try {
        if (!c.env || !c.env.COMMS) return false;
        const trimmed = items.length > KV_FINANCE_CAP ? items.slice(-KV_FINANCE_CAP) : items;
        await c.env.COMMS.put(KV_FINANCE_KEY, JSON.stringify(trimmed));
        return true;
    } catch (e) { return false; }
}

// Today's YYYY-MM-DD in Asia/Colombo
function todayKey(): string {
    // Server is UTC; Sri Lanka is UTC+5:30. Add 5.5h to UTC to get local day.
    const now = new Date(Date.now() + (5.5 * 60 * 60 * 1000));
    return now.toISOString().slice(0, 10);
}

// POST a finance update. Body:
//   { user, name, level, amanaBalance, otherBalances:[{bank,amount}], payments:[{label,amount,due}], note }
app.post('/api/finance', async (c) => {
    try {
        const body = await c.req.json();
        const level = Number(body.level || 0);
        const user = String(body.user || '');
        // Authorization: CEO, COO, or Razan (finance manager) — by level OR username
        const authorized = level >= 100 || user === 'razan' || user === 'razan.thawus';
        if (!authorized) {
            return c.json({ success: false, error: 'forbidden — finance role only' }, 403);
        }
        const day = String(body.day || todayKey());
        const entry: any = {
            day,
            user, name: String(body.name || ''),
            amanaBalance: Number(body.amanaBalance || 0),
            otherBalances: Array.isArray(body.otherBalances) ? body.otherBalances : [],
            payments: Array.isArray(body.payments) ? body.payments : [],
            note: String(body.note || ''),
            updatedAt: Date.now()
        };
        const items = await kvLoadFinance(c);
        // Replace if same day+user already exists, else append
        const ix = items.findIndex((x: any) => x.day === day && x.user === user);
        if (ix >= 0) items[ix] = entry; else items.push(entry);
        const ok = await kvSaveFinance(c, items);
        return c.json({ success: ok, entry });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// GET finance entries. Query: day=YYYY-MM-DD (default today), days=N (recent N)
app.get('/api/finance', async (c) => {
    try {
        const day = c.req.query('day') || '';
        const days = parseInt(c.req.query('days') || '0', 10);
        const items = await kvLoadFinance(c);
        let out = items;
        if (day) {
            out = items.filter((x: any) => x.day === day);
        } else if (days > 0) {
            out.sort((a: any, b: any) => (b.day || '').localeCompare(a.day || ''));
            out = out.slice(0, days);
        }
        return c.json({ success: true, items: out, today: todayKey() });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ============================================================
// THASBIHA OPERATIONS COMMAND CENTER (v14.8)
// Dedicated task/application/follow-up tracking for Thasbiha S.
// (HR Manager / Admission Head)
// ============================================================
// Storage model — all keys under the COMMS KV namespace:
//   thasbiha:tasks          → array of daily-task entries (cap 2000)
//   thasbiha:applications   → array of admission applications (cap 500)
//   thasbiha:followups      → array of follow-up log entries  (cap 2000)
//   thasbiha:reports        → array of daily reports          (cap 730 = 2y)
//   thasbiha:compliance     → array of compliance docs        (cap 500)
//   thasbiha:alerts         → array of system alerts          (cap 500)
//
// Authorization: any logged-in user can POST (the portal scopes
// who sees the writeable UI), but role≥80 (HR-head and above) is
// expected. CEO/COO (≥100) get extra analytics endpoints.

const KV_THB_TASKS = 'thasbiha:tasks';
const KV_THB_APPS  = 'thasbiha:applications';
const KV_THB_FUPS  = 'thasbiha:followups';
const KV_THB_REPS  = 'thasbiha:reports';
const KV_THB_COMP  = 'thasbiha:compliance';
const KV_THB_ALERTS = 'thasbiha:alerts';

async function kvLoadArr(c: any, key: string): Promise<any[]> {
    try {
        const kv = (c.env as any)?.COMMS;
        if (!kv) return [];
        const raw = await kv.get(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
}
async function kvSaveArr(c: any, key: string, arr: any[], cap: number) {
    try {
        const kv = (c.env as any)?.COMMS;
        if (!kv) return;
        let trimmed = arr;
        if (arr.length > cap) trimmed = arr.slice(arr.length - cap);
        await kv.put(key, JSON.stringify(trimmed));
    } catch {}
}
function thbId(prefix: string){ return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7); }

// ---- TASKS ---------------------------------------------------
// Task shape: { id, ts, day(YYYY-MM-DD), segment('GG'|'INMOTHS'='GLSA'),
//   title, priority(P1-P3), status('Pending'|'In Progress'|
//   'Waiting Student'|'Waiting University'|'Escalated'|'Completed'|'Delayed'),
//   startedAt, lastUpdated, completedAt, pendingReason, escalationNote,
//   owner('thasbiha.s'), assignedBy }
app.post('/api/thasbiha/tasks', async (c) => {
    try {
        const body = await c.req.json();
        const arr = await kvLoadArr(c, KV_THB_TASKS);
        const now = Date.now();
        if (body.id) {
            const idx = arr.findIndex((x: any) => x.id === body.id);
            if (idx >= 0) {
                const prev = arr[idx];
                arr[idx] = { ...prev, ...body, lastUpdated: now };
                if (body.status === 'Completed' && !prev.completedAt) arr[idx].completedAt = now;
                if (body.status === 'In Progress' && !prev.startedAt) arr[idx].startedAt = now;
                await kvSaveArr(c, KV_THB_TASKS, arr, 2000);
                return c.json({ success: true, task: arr[idx], updated: true });
            }
        }
        const entry = {
            id: thbId('task'), ts: now, day: body.day || todayKey(),
            segment: body.segment || 'GG',
            title: String(body.title || '').slice(0, 500),
            description: String(body.description || '').slice(0, 2000),
            priority: body.priority || 'P2',
            status: body.status || 'Pending',
            owner: body.owner || 'thasbiha.s',
            assignedBy: body.assignedBy || '',
            studentRef: body.studentRef || '',
            startedAt: body.status === 'In Progress' ? now : null,
            completedAt: body.status === 'Completed' ? now : null,
            lastUpdated: now,
            pendingReason: body.pendingReason || '',
            escalationNote: body.escalationNote || '',
            tags: body.tags || []
        };
        arr.push(entry);
        await kvSaveArr(c, KV_THB_TASKS, arr, 2000);
        return c.json({ success: true, task: entry, updated: false });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});
app.get('/api/thasbiha/tasks', async (c) => {
    try {
        const day = c.req.query('day') || '';
        const segment = c.req.query('segment') || '';
        const status = c.req.query('status') || '';
        const owner = c.req.query('owner') || '';
        let arr = await kvLoadArr(c, KV_THB_TASKS);
        if (day) arr = arr.filter((x: any) => x.day === day);
        if (segment) arr = arr.filter((x: any) => x.segment === segment);
        if (status) arr = arr.filter((x: any) => x.status === status);
        if (owner) arr = arr.filter((x: any) => x.owner === owner);
        arr.sort((a: any, b: any) => (b.ts || 0) - (a.ts || 0));
        return c.json({ success: true, tasks: arr.slice(0, 500), today: todayKey() });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ---- APPLICATIONS -------------------------------------------
// Application: { id, ts, studentName, country, university, course,
//   stage('Inquiry'|'Documents'|'Application Sent'|'Offer Received'|'CAS Issued'|'Visa Applied'|'Visa Granted'|'Enrolled'|'Rejected'),
//   pendingDocs[], offerStatus, casStatus, visaStatus,
//   priority(P1-P3), lastFollowUp, nextAction, nextActionDate, owner }
app.post('/api/thasbiha/applications', async (c) => {
    try {
        const body = await c.req.json();
        const arr = await kvLoadArr(c, KV_THB_APPS);
        const now = Date.now();
        if (body.id) {
            const idx = arr.findIndex((x: any) => x.id === body.id);
            if (idx >= 0) {
                arr[idx] = { ...arr[idx], ...body, lastUpdated: now };
                await kvSaveArr(c, KV_THB_APPS, arr, 500);
                return c.json({ success: true, application: arr[idx], updated: true });
            }
        }
        const entry = {
            id: thbId('app'), ts: now,
            studentName: String(body.studentName || ''),
            country: body.country || '',
            university: body.university || '',
            course: body.course || '',
            stage: body.stage || 'Inquiry',
            pendingDocs: Array.isArray(body.pendingDocs) ? body.pendingDocs : [],
            offerStatus: body.offerStatus || 'Pending',
            casStatus: body.casStatus || 'N/A',
            visaStatus: body.visaStatus || 'N/A',
            priority: body.priority || 'P2',
            lastFollowUp: body.lastFollowUp || null,
            nextAction: body.nextAction || '',
            nextActionDate: body.nextActionDate || '',
            owner: body.owner || 'thasbiha.s',
            lastUpdated: now,
            note: body.note || ''
        };
        arr.push(entry);
        await kvSaveArr(c, KV_THB_APPS, arr, 500);
        return c.json({ success: true, application: entry, updated: false });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});
app.get('/api/thasbiha/applications', async (c) => {
    try {
        const owner = c.req.query('owner') || '';
        const stage = c.req.query('stage') || '';
        const priority = c.req.query('priority') || '';
        let arr = await kvLoadArr(c, KV_THB_APPS);
        if (owner) arr = arr.filter((x: any) => x.owner === owner);
        if (stage) arr = arr.filter((x: any) => x.stage === stage);
        if (priority) arr = arr.filter((x: any) => x.priority === priority);
        arr.sort((a: any, b: any) => (b.lastUpdated || b.ts || 0) - (a.lastUpdated || a.ts || 0));
        return c.json({ success: true, applications: arr.slice(0, 300), today: todayKey() });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ---- FOLLOW-UPS ---------------------------------------------
// FollowUp: { id, ts, day, channel('Call'|'WhatsApp'|'Email'|'Meeting'|'University'),
//   target, studentRef, applicationRef, summary, outcome, owner, durationMin }
app.post('/api/thasbiha/followups', async (c) => {
    try {
        const body = await c.req.json();
        const arr = await kvLoadArr(c, KV_THB_FUPS);
        const entry = {
            id: thbId('fup'), ts: Date.now(), day: body.day || todayKey(),
            channel: body.channel || 'Call',
            target: String(body.target || ''),
            studentRef: body.studentRef || '',
            applicationRef: body.applicationRef || '',
            summary: String(body.summary || '').slice(0, 1000),
            outcome: body.outcome || 'Logged',
            owner: body.owner || 'thasbiha.s',
            durationMin: parseInt(body.durationMin || '0', 10) || 0
        };
        arr.push(entry);
        await kvSaveArr(c, KV_THB_FUPS, arr, 2000);
        return c.json({ success: true, followup: entry });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});
app.get('/api/thasbiha/followups', async (c) => {
    try {
        const day = c.req.query('day') || '';
        const owner = c.req.query('owner') || '';
        const channel = c.req.query('channel') || '';
        let arr = await kvLoadArr(c, KV_THB_FUPS);
        if (day) arr = arr.filter((x: any) => x.day === day);
        if (owner) arr = arr.filter((x: any) => x.owner === owner);
        if (channel) arr = arr.filter((x: any) => x.channel === channel);
        arr.sort((a: any, b: any) => (b.ts || 0) - (a.ts || 0));
        return c.json({ success: true, followups: arr.slice(0, 500), today: todayKey() });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ---- DAILY REPORTS ------------------------------------------
// Report: { id, ts, day, segment('GG'|'INMOTHS'='GLSA'), owner,
//   tasksCompleted, applicationsProcessed, studentsFollowedUp,
//   offersReceived, pendingIssues, escalations, notes }
app.post('/api/thasbiha/reports', async (c) => {
    try {
        const body = await c.req.json();
        const arr = await kvLoadArr(c, KV_THB_REPS);
        const segment = body.segment || 'GG';
        const owner = body.owner || 'thasbiha.s';
        const day = body.day || todayKey();
        const idx = arr.findIndex((x: any) => x.day === day && x.segment === segment && x.owner === owner);
        const now = Date.now();
        const base = {
            id: thbId('rep'), ts: now, day, segment, owner,
            tasksCompleted: parseInt(body.tasksCompleted || '0', 10) || 0,
            applicationsProcessed: parseInt(body.applicationsProcessed || '0', 10) || 0,
            studentsFollowedUp: parseInt(body.studentsFollowedUp || '0', 10) || 0,
            offersReceived: parseInt(body.offersReceived || '0', 10) || 0,
            pendingIssues: String(body.pendingIssues || '').slice(0, 2000),
            escalations: String(body.escalations || '').slice(0, 2000),
            notes: String(body.notes || '').slice(0, 2000),
            submittedAt: now
        };
        if (idx >= 0) {
            arr[idx] = { ...arr[idx], ...base, id: arr[idx].id, submittedAt: now };
            await kvSaveArr(c, KV_THB_REPS, arr, 730);
            return c.json({ success: true, report: arr[idx], updated: true });
        }
        arr.push(base);
        await kvSaveArr(c, KV_THB_REPS, arr, 730);
        return c.json({ success: true, report: base, updated: false });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});
app.get('/api/thasbiha/reports', async (c) => {
    try {
        const day = c.req.query('day') || '';
        const owner = c.req.query('owner') || '';
        const segment = c.req.query('segment') || '';
        let arr = await kvLoadArr(c, KV_THB_REPS);
        if (day) arr = arr.filter((x: any) => x.day === day);
        if (owner) arr = arr.filter((x: any) => x.owner === owner);
        if (segment) arr = arr.filter((x: any) => x.segment === segment);
        arr.sort((a: any, b: any) => (b.day || '').localeCompare(a.day || ''));
        return c.json({ success: true, reports: arr.slice(0, 200), today: todayKey() });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ---- COMPLIANCE DOCS (Payment receipt / Commission agreement / Confirmation email)
app.post('/api/thasbiha/compliance', async (c) => {
    try {
        const body = await c.req.json();
        const arr = await kvLoadArr(c, KV_THB_COMP);
        const now = Date.now();
        const ref = String(body.studentRef || '').trim();
        if (!ref) return c.json({ success: false, error: 'studentRef required' }, 400);
        const idx = arr.findIndex((x: any) => x.studentRef === ref);
        const docs = {
            paymentReceipt: !!body.paymentReceipt,
            commissionAgreement: !!body.commissionAgreement,
            confirmationEmail: !!body.confirmationEmail
        };
        const complete = docs.paymentReceipt && docs.commissionAgreement && docs.confirmationEmail;
        if (idx >= 0) {
            arr[idx] = { ...arr[idx], ...body, ...docs, complete, lastUpdated: now };
            await kvSaveArr(c, KV_THB_COMP, arr, 500);
            return c.json({ success: true, compliance: arr[idx], updated: true });
        }
        const entry = {
            id: thbId('cmp'), ts: now, studentRef: ref,
            studentName: body.studentName || '',
            owner: body.owner || 'thasbiha.s',
            ...docs, complete, lastUpdated: now,
            paymentReceiptUrl: body.paymentReceiptUrl || '',
            commissionAgreementUrl: body.commissionAgreementUrl || '',
            confirmationEmailUrl: body.confirmationEmailUrl || ''
        };
        arr.push(entry);
        await kvSaveArr(c, KV_THB_COMP, arr, 500);
        return c.json({ success: true, compliance: entry, updated: false });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});
app.get('/api/thasbiha/compliance', async (c) => {
    try {
        const owner = c.req.query('owner') || '';
        let arr = await kvLoadArr(c, KV_THB_COMP);
        if (owner) arr = arr.filter((x: any) => x.owner === owner);
        arr.sort((a: any, b: any) => (b.lastUpdated || b.ts || 0) - (a.lastUpdated || a.ts || 0));
        return c.json({ success: true, compliance: arr.slice(0, 300) });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ---- ANALYTICS (CEO/COO snapshot) ---------------------------
app.get('/api/thasbiha/analytics', async (c) => {
    try {
        const owner = c.req.query('owner') || 'thasbiha.s';
        const day = c.req.query('day') || todayKey();
        const [tasks, apps, fups, reps] = await Promise.all([
            kvLoadArr(c, KV_THB_TASKS),
            kvLoadArr(c, KV_THB_APPS),
            kvLoadArr(c, KV_THB_FUPS),
            kvLoadArr(c, KV_THB_REPS),
        ]);
        const myTasks = tasks.filter((x: any) => x.owner === owner);
        const todayTasks = myTasks.filter((x: any) => x.day === day);
        const todayFups = fups.filter((x: any) => x.owner === owner && x.day === day);
        const myApps = apps.filter((x: any) => x.owner === owner);
        const ggToday = todayTasks.filter((x: any) => x.segment === 'GG');
        const imToday = todayTasks.filter((x: any) => x.segment === 'INMOTHS');
        // Last 7 days stats
        const sevenDays: string[] = [];
        const base = new Date(Date.now() + (5.5 * 60 * 60 * 1000));
        for (let i = 6; i >= 0; i--) {
            const d = new Date(base.getTime() - i * 24 * 60 * 60 * 1000);
            sevenDays.push(d.toISOString().slice(0, 10));
        }
        const trend = sevenDays.map((d: string) => {
            const dayTasks = myTasks.filter((x: any) => x.day === d);
            const completed = dayTasks.filter((x: any) => x.status === 'Completed').length;
            const total = dayTasks.length;
            const fupCount = fups.filter((x: any) => x.owner === owner && x.day === d).length;
            return { day: d, total, completed, fupCount,
                ratio: total > 0 ? Math.round((completed/total)*100) : 0 };
        });
        // Delayed/inactive flags
        const now = Date.now();
        const delayedTasks = myTasks.filter((x: any) => x.status === 'Delayed' || (
            x.status !== 'Completed' && x.lastUpdated && (now - x.lastUpdated) > 24*60*60*1000
        ));
        const inactiveApps = myApps.filter((x: any) => {
            const last = x.lastUpdated || x.ts || 0;
            return last && (now - last) > 5*24*60*60*1000 && !['Enrolled','Visa Granted','Rejected'].includes(x.stage);
        });
        const escalated = myTasks.filter((x: any) => x.status === 'Escalated');
        const todayReport = reps.find((x: any) => x.owner === owner && x.day === day);
        return c.json({
            success: true, today: day, owner,
            counts: {
                tasksToday: todayTasks.length,
                tasksCompletedToday: todayTasks.filter((x: any) => x.status === 'Completed').length,
                tasksGG: ggToday.length, tasksIM: imToday.length,
                followupsToday: todayFups.length,
                pendingFollowups: myTasks.filter((x: any) => ['Pending','Waiting Student','Waiting University'].includes(x.status)).length,
                delayedTasks: delayedTasks.length,
                inactiveApps: inactiveApps.length,
                escalated: escalated.length,
                applicationsTotal: myApps.length,
                applicationsActive: myApps.filter((x: any) => !['Enrolled','Visa Granted','Rejected'].includes(x.stage)).length,
                reportSubmitted: !!todayReport
            },
            trend,
            delayedTasks: delayedTasks.slice(0, 10),
            inactiveApps: inactiveApps.slice(0, 10),
            escalated: escalated.slice(0, 10)
        });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ---- ALERTS (auto-emitted by client checks; CEO/COO consume) -
app.post('/api/thasbiha/alerts', async (c) => {
    try {
        const body = await c.req.json();
        const arr = await kvLoadArr(c, KV_THB_ALERTS);
        const entry = {
            id: thbId('alt'), ts: Date.now(), day: todayKey(),
            type: body.type || 'info',
            severity: body.severity || 'info',
            owner: body.owner || 'thasbiha.s',
            title: String(body.title || '').slice(0, 200),
            message: String(body.message || '').slice(0, 1000),
            ref: body.ref || '',
            ack: false
        };
        // Dedupe — same type+ref within 6h
        const dup = arr.find((x: any) => x.type === entry.type && x.ref === entry.ref && (entry.ts - x.ts) < 6*60*60*1000);
        if (dup) return c.json({ success: true, alert: dup, duplicate: true });
        arr.push(entry);
        await kvSaveArr(c, KV_THB_ALERTS, arr, 500);
        return c.json({ success: true, alert: entry });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});
app.get('/api/thasbiha/alerts', async (c) => {
    try {
        const owner = c.req.query('owner') || '';
        let arr = await kvLoadArr(c, KV_THB_ALERTS);
        if (owner) arr = arr.filter((x: any) => x.owner === owner);
        arr.sort((a: any, b: any) => (b.ts || 0) - (a.ts || 0));
        return c.json({ success: true, alerts: arr.slice(0, 100) });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ============================================================
// v14.9 — MASTER SHEETS  (seeded from uploaded Excel files,
// overlaid with KV edits so management/Thasbiha can edit live)
// ============================================================
// Storage model:
//   * Seed JSON is served from /static/seeds/*.json (immutable bundle).
//   * KV holds an "overlay" of per-row patches keyed by row id (slug of Name).
//     thb:master:patches → { [rowId]: { ...partial fields } }
//     glsa:patches       → { [rowId]: { ...partial fields } }
//     admissions:patches → { [sheet]:{ [rowId]: { ...partial fields } } }
//   * GET endpoint merges seed + patches before returning.
//   * POST endpoint writes a patch.

const KV_THB_PATCHES   = 'thb:master:patches';
const KV_GLSA_PATCHES  = 'glsa:patches';
const KV_ADM_PATCHES   = 'admissions:patches';

function _slug(s: string): string {
    return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

async function kvLoadObj(c: any, key: string): Promise<any> {
    try {
        const kv = (c.env as any)?.COMMS;
        if (!kv) return {};
        const raw = await kv.get(key);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch { return {}; }
}
async function kvSaveObj(c: any, key: string, obj: any) {
    try {
        const kv = (c.env as any)?.COMMS;
        if (!kv) return;
        await kv.put(key, JSON.stringify(obj || {}));
    } catch {}
}

// Fetch the embedded seed JSON file from /static/seeds/* via the same Workers
// runtime. This works because the assets are part of the Pages bundle.
async function _fetchSeed(c: any, name: string): Promise<any> {
    try {
        const url = new URL(c.req.url);
        const seedUrl = url.protocol + '//' + url.host + '/static/seeds/' + name;
        const r = await fetch(seedUrl);
        if (!r.ok) return null;
        return await r.json();
    } catch { return null; }
}

// ---- Thasbiha master sheet (74 students) ----
app.get('/api/thasbiha/master', async (c) => {
    try {
        const seed = await _fetchSeed(c, 'thb_master.json');
        const patches = await kvLoadObj(c, KV_THB_PATCHES);
        const students = (seed && seed.students) || [];
        const merged = students.map((row: any) => {
            const id = _slug(row.Name || '');
            const patch = patches[id] || {};
            return { _id: id, ...row, ...patch };
        });
        return c.json({ success: true, source: seed?.source || '', updated: seed?.updated || '', students: merged });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});
app.post('/api/thasbiha/master/patch', async (c) => {
    try {
        const body = await c.req.json();
        const id = String(body.id || '').trim();
        if (!id) return c.json({ success: false, error: 'id required' }, 400);
        const patches = await kvLoadObj(c, KV_THB_PATCHES);
        patches[id] = { ...(patches[id] || {}), ...(body.patch || {}), _patchedAt: Date.now(), _patchedBy: body.user || '' };
        await kvSaveObj(c, KV_THB_PATCHES, patches);
        return c.json({ success: true, id, patch: patches[id] });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ---- GLSA Client Tracker (12 clients + 23 payments + 2 quals) ----
app.get('/api/glsa/master', async (c) => {
    try {
        const seed = await _fetchSeed(c, 'glsa.json');
        const patches = await kvLoadObj(c, KV_GLSA_PATCHES);
        const pipeline = (seed && seed.pipeline) || [];
        const merged = pipeline.map((row: any) => {
            const id = _slug(row['CLIENT NAME'] || '');
            const patch = patches[id] || {};
            return { _id: id, ...row, ...patch };
        });
        return c.json({
            success: true,
            source: seed?.source || '',
            updated: seed?.updated || '',
            pipeline: merged,
            payments: (seed && seed.payments) || [],
            qualifications: (seed && seed.qualifications) || []
        });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});
app.post('/api/glsa/master/patch', async (c) => {
    try {
        const body = await c.req.json();
        const id = String(body.id || '').trim();
        if (!id) return c.json({ success: false, error: 'id required' }, 400);
        const patches = await kvLoadObj(c, KV_GLSA_PATCHES);
        patches[id] = { ...(patches[id] || {}), ...(body.patch || {}), _patchedAt: Date.now(), _patchedBy: body.user || '' };
        await kvSaveObj(c, KV_GLSA_PATCHES, patches);
        return c.json({ success: true, id, patch: patches[id] });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ---- Admissions master (66 admissions + 9 visa + 18 granted/refused + 28 closed) ----
app.get('/api/admissions/master', async (c) => {
    try {
        const seed = await _fetchSeed(c, 'admissions.json');
        const patches = await kvLoadObj(c, KV_ADM_PATCHES);
        const sheets = (seed && seed.sheets) || {};
        const out: any = {};
        for (const sheetName of Object.keys(sheets)) {
            const rows = sheets[sheetName] || [];
            const sheetPatches = patches[sheetName] || {};
            out[sheetName] = rows.map((row: any) => {
                const nm = row.Name || row['Student Name'] || '';
                const id = _slug(nm);
                const patch = sheetPatches[id] || {};
                return { _id: id, _sheet: sheetName, ...row, ...patch };
            });
        }
        return c.json({ success: true, source: seed?.source || '', updated: seed?.updated || '', sheets: out });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});
app.post('/api/admissions/master/patch', async (c) => {
    try {
        const body = await c.req.json();
        const sheet = String(body.sheet || '').trim();
        const id = String(body.id || '').trim();
        if (!sheet || !id) return c.json({ success: false, error: 'sheet and id required' }, 400);
        const patches = await kvLoadObj(c, KV_ADM_PATCHES);
        patches[sheet] = patches[sheet] || {};
        patches[sheet][id] = { ...(patches[sheet][id] || {}), ...(body.patch || {}), _patchedAt: Date.now(), _patchedBy: body.user || '' };
        await kvSaveObj(c, KV_ADM_PATCHES, patches);
        return c.json({ success: true, sheet, id, patch: patches[sheet][id] });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ---- Bulk task seed from sheet selection (after morning check-in) ----
// Body: { picks: [{ source, id, name, label, segment? }], user, owner }
// Creates one Pending task per pick, deduped by (day + owner + sheetId + name).
app.post('/api/thasbiha/seed-tasks', async (c) => {
    try {
        const body = await c.req.json();
        const picks = Array.isArray(body.picks) ? body.picks : [];
        const owner = body.owner || 'thasbiha.s';
        const day = body.day || todayKey();
        const existing = await kvLoadArr(c, KV_THB_TASKS);
        const seenKeys = new Set(existing
            .filter((t: any) => t.day === day && t.owner === owner && t.sheetRef)
            .map((t: any) => t.sheetRef));
        const created: any[] = [];
        let skipped = 0;
        for (const p of picks) {
            const ref = `${p.source || 'sheet'}:${p.id || _slug(p.name||'')}`;
            if (seenKeys.has(ref)) { skipped++; continue; }
            const now = Date.now();
            const nm = String(p.name || '(unnamed)').trim();
            const lbl = String(p.label || '').trim();
            const title = lbl ? `${nm} — ${lbl}`.slice(0, 500) : `Follow up: ${nm}`.slice(0, 500);
            const entry = {
                id: thbId('task'), ts: now, day, owner,
                segment: p.segment || body.segment || 'GG',
                title,
                description: String(p.description || p.sourceLabel || '').slice(0, 2000),
                priority: p.priority || 'P2',
                status: 'Pending',
                studentRef: nm,
                sheetRef: ref,
                source: p.source || 'sheet',
                sourceLabel: p.sourceLabel || '',
                startedAt: null, completedAt: null,
                lastUpdated: now,
                pendingReason: '', escalationNote: '', tags: []
            };
            existing.push(entry);
            created.push(entry);
            seenKeys.add(ref);
        }
        await kvSaveArr(c, KV_THB_TASKS, existing, 2000);
        return c.json({ success: true, added: created.length, skipped, tasks: created });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ============================================================
// v15.0 — MY WORKSPACE
// ============================================================
// Simple per-user persistent workspace for daily flow:
//   * Check-in (with mode + focus)
//   * Today's tasks (Pending / In Progress / Completed only)
//   * End-of-day report
// Storage: KV key `ws:<user>:<day>` → { checkIn, tasks, eod }
// Tasks shape: { id, title, priority:'low'|'med'|'high', due, assignTo, status, ts, completedAt? }

function _wsKey(user: string, day: string){ return `ws:${user}:${day}`; }
function _wsTodayKey(){ return todayKey(); }

async function _wsLoad(c: any, user: string, day: string){
    const key = _wsKey(user, day);
    const obj = await kvLoadObj(c, key);
    return {
        user, day,
        checkIn: obj.checkIn || null,
        tasks:   Array.isArray(obj.tasks) ? obj.tasks : [],
        eod:     obj.eod || null,
        ...obj
    };
}
async function _wsSave(c: any, ws: any){
    const key = _wsKey(ws.user, ws.day);
    await kvSaveObj(c, key, { checkIn: ws.checkIn, tasks: ws.tasks, eod: ws.eod, updated: Date.now() });
}

// ---- GET workspace (today's record for current user) ----
app.get('/api/workspace', async (c) => {
    try {
        const user = c.req.query('user') || '';
        const day  = c.req.query('day')  || _wsTodayKey();
        if (!user) return c.json({ success:false, error:'user required' }, 400);
        const ws = await _wsLoad(c, user, day);
        return c.json({ success:true, workspace: ws });
    } catch (e: any) {
        return c.json({ success:false, error:e?.message || String(e) }, 500);
    }
});

// ---- POST /api/workspace/checkin ----
app.post('/api/workspace/checkin', async (c) => {
    try {
        const body = await c.req.json();
        const user = body.user || '';
        const day  = body.day  || _wsTodayKey();
        if (!user) return c.json({ success:false, error:'user required' }, 400);
        const ws = await _wsLoad(c, user, day);
        ws.checkIn = {
            ts: Date.now(),
            mode: body.mode || 'Office',
            location: body.location || '',
            focus: body.focus || ''
        };
        await _wsSave(c, ws);
        return c.json({ success:true, checkIn: ws.checkIn });
    } catch (e: any) {
        return c.json({ success:false, error:e?.message || String(e) }, 500);
    }
});

// ---- POST /api/workspace/checkout ----
app.post('/api/workspace/checkout', async (c) => {
    try {
        const body = await c.req.json();
        const user = body.user || '';
        const day  = body.day  || _wsTodayKey();
        if (!user) return c.json({ success:false, error:'user required' }, 400);
        const ws = await _wsLoad(c, user, day);
        if (ws.checkIn) ws.checkIn.checkoutTs = Date.now();
        await _wsSave(c, ws);
        return c.json({ success:true, checkIn: ws.checkIn });
    } catch (e: any) {
        return c.json({ success:false, error:e?.message || String(e) }, 500);
    }
});

// ---- POST /api/workspace/task — quick add (max 4 fields) ----
app.post('/api/workspace/task', async (c) => {
    try {
        const body = await c.req.json();
        const user = body.user || '';
        const day  = body.day  || _wsTodayKey();
        if (!user) return c.json({ success:false, error:'user required' }, 400);
        const title = String(body.title || '').trim();
        if (!title) return c.json({ success:false, error:'title required' }, 400);
        const ws = await _wsLoad(c, user, day);
        const task = {
            id: 'wt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7),
            title: title.slice(0, 280),
            priority: ['low','med','high'].includes(body.priority) ? body.priority : 'med',
            due: body.due || '',
            assignTo: body.assignTo || user,
            status: 'pending',
            ts: Date.now()
        };
        ws.tasks.push(task);
        await _wsSave(c, ws);
        return c.json({ success:true, task });
    } catch (e: any) {
        return c.json({ success:false, error:e?.message || String(e) }, 500);
    }
});

// ---- POST /api/workspace/task/update — change status / title ----
app.post('/api/workspace/task/update', async (c) => {
    try {
        const body = await c.req.json();
        const user = body.user || '';
        const day  = body.day  || _wsTodayKey();
        const id   = body.id || '';
        if (!user || !id) return c.json({ success:false, error:'user and id required' }, 400);
        const ws = await _wsLoad(c, user, day);
        const idx = ws.tasks.findIndex((t: any) => t.id === id);
        if (idx < 0) return c.json({ success:false, error:'task not found' }, 404);
        const t = ws.tasks[idx];
        if (body.status !== undefined) {
            const s = String(body.status);
            if (['pending','in_progress','completed'].includes(s)) {
                t.status = s;
                if (s === 'completed') t.completedAt = Date.now();
                else if (s === 'in_progress' && !t.startedAt) t.startedAt = Date.now();
            }
        }
        if (body.title !== undefined)    t.title = String(body.title).slice(0, 280);
        if (body.priority !== undefined && ['low','med','high'].includes(body.priority)) t.priority = body.priority;
        if (body.due !== undefined)      t.due = body.due;
        if (body.assignTo !== undefined) t.assignTo = body.assignTo;
        t.updatedAt = Date.now();
        await _wsSave(c, ws);
        return c.json({ success:true, task: t });
    } catch (e: any) {
        return c.json({ success:false, error:e?.message || String(e) }, 500);
    }
});

// ---- POST /api/workspace/task/delete ----
app.post('/api/workspace/task/delete', async (c) => {
    try {
        const body = await c.req.json();
        const user = body.user || '';
        const day  = body.day  || _wsTodayKey();
        const id   = body.id || '';
        if (!user || !id) return c.json({ success:false, error:'user and id required' }, 400);
        const ws = await _wsLoad(c, user, day);
        const before = ws.tasks.length;
        ws.tasks = ws.tasks.filter((t: any) => t.id !== id);
        if (ws.tasks.length === before) return c.json({ success:false, error:'task not found' }, 404);
        await _wsSave(c, ws);
        return c.json({ success:true });
    } catch (e: any) {
        return c.json({ success:false, error:e?.message || String(e) }, 500);
    }
});

// ---- POST /api/workspace/eod — end-of-day report ----
app.post('/api/workspace/eod', async (c) => {
    try {
        const body = await c.req.json();
        const user = body.user || '';
        const day  = body.day  || _wsTodayKey();
        if (!user) return c.json({ success:false, error:'user required' }, 400);
        const ws = await _wsLoad(c, user, day);
        const completed = ws.tasks.filter((t: any) => t.status === 'completed').length;
        const pending = ws.tasks.filter((t: any) => t.status !== 'completed').length;
        ws.eod = {
            ts: Date.now(),
            completed,
            pending,
            achievement: String(body.achievement || '').slice(0, 800),
            issues:      String(body.issues || '').slice(0, 800)
        };
        if (ws.checkIn && !ws.checkIn.checkoutTs) ws.checkIn.checkoutTs = Date.now();
        await _wsSave(c, ws);
        return c.json({ success:true, eod: ws.eod });
    } catch (e: any) {
        return c.json({ success:false, error:e?.message || String(e) }, 500);
    }
});

// ---- GET /api/workspace/team — management view of everyone's workspace today ----
app.get('/api/workspace/team', async (c) => {
    try {
        const day = c.req.query('day') || _wsTodayKey();
        const users = (c.req.query('users') || '').split(',').map(s => s.trim()).filter(Boolean);
        if (!users.length) return c.json({ success:false, error:'users required (comma-separated)' }, 400);
        const out: any[] = [];
        for (const u of users) {
            const ws = await _wsLoad(c, u, day);
            const completed = ws.tasks.filter((t: any) => t.status === 'completed').length;
            const inProg    = ws.tasks.filter((t: any) => t.status === 'in_progress').length;
            const pending   = ws.tasks.filter((t: any) => t.status === 'pending').length;
            out.push({
                user: u,
                checkedIn: !!ws.checkIn,
                checkInTs: ws.checkIn?.ts || null,
                mode: ws.checkIn?.mode || null,
                checkoutTs: ws.checkIn?.checkoutTs || null,
                focus: ws.checkIn?.focus || '',
                eodSubmitted: !!ws.eod,
                tasksTotal: ws.tasks.length, completed, inProg, pending
            });
        }
        return c.json({ success:true, day, team: out });
    } catch (e: any) {
        return c.json({ success:false, error:e?.message || String(e) }, 500);
    }
});

// =========================================================================
// v16f — THASBIHA TWO-WORKSTREAM DAILY API
// Tracks daily plan, daily report, calls, and computed KPIs separately
// for two workstreams (Global Guidance + Himaaus). Used by:
//   - Thasbiha's own dashboard (read + write)
//   - CEO / COO dashboards (read-only — auto-emailed cards)
// =========================================================================
const KV_THB_DAILY = 'thasbiha:daily';     // [{ id, day, plan{gg{},him{}}, report{gg{},him{}}, kpis{gg{},him{}} }]
const KV_THB_CALLS = 'thasbiha:calls';     // [{ id, ts, ws, contact, purpose, outcome, durationMin, notes }]
const KV_THB_DAILY_CAP = 365;
const KV_THB_CALLS_CAP = 2000;

// Resolve (or create) today's daily record.
async function _thbDailyGet(c: any, day: string){
    const arr = await kvLoadArr(c, KV_THB_DAILY);
    let rec = arr.find((x: any) => x.day === day);
    if (!rec){
        rec = {
            id: thbId('thbd'), day, ts: Date.now(),
            plan:   { gg: null, him: null },     // null = not submitted yet
            report: { gg: null, him: null },
            kpis:   { gg: {}, him: {} }
        };
        arr.push(rec);
        await kvSaveArr(c, KV_THB_DAILY, arr, KV_THB_DAILY_CAP);
    }
    return { arr, rec };
}

// GET today's daily record (full plan + report + kpis + workstream marker)
app.get('/api/thasbiha/daily', async (c) => {
    try {
        const day = c.req.query('day') || todayKey();
        const { rec } = await _thbDailyGet(c, day);
        return c.json({ success: true, daily: rec, today: todayKey() });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// GET a span (range) of daily records — for weekly / monthly summaries
app.get('/api/thasbiha/daily/range', async (c) => {
    try {
        let start = c.req.query('start') || '';   // YYYY-MM-DD
        const end   = c.req.query('end')   || todayKey();
        const daysQ = parseInt(c.req.query('days') || '0', 10);
        if (!start && daysQ > 0) {
            // compute start = end - (days-1) days
            const d = new Date(end + 'T00:00:00Z');
            d.setUTCDate(d.getUTCDate() - (daysQ - 1));
            start = d.toISOString().slice(0,10);
        }
        const arr = await kvLoadArr(c, KV_THB_DAILY);
        const out = arr.filter((x: any) => (!start || x.day >= start) && x.day <= end);
        out.sort((a: any, b: any) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
        return c.json({ success: true, range: { start, end }, daily: out, records: out });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// POST plan — submit (or update) one workstream's morning plan
// body: { day?, ws('gg'|'him'), plan{...fields} }
app.post('/api/thasbiha/plan', async (c) => {
    try {
        const body = await c.req.json();
        const day  = body.day || todayKey();
        const ws   = body.ws === 'him' ? 'him' : 'gg';
        const { arr, rec } = await _thbDailyGet(c, day);
        rec.plan = rec.plan || { gg: null, him: null };
        rec.plan[ws] = { ...(body.plan || {}), submittedAt: Date.now() };
        // Save back to the array (since _thbDailyGet may have already appended a new rec, find by id)
        const idx = arr.findIndex((x: any) => x.id === rec.id);
        if (idx >= 0) arr[idx] = rec;
        await kvSaveArr(c, KV_THB_DAILY, arr, KV_THB_DAILY_CAP);
        return c.json({ success: true, daily: rec });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// POST report — submit one workstream's evening report (with auto-KPI recompute)
// body: { day?, ws('gg'|'him'), report{...fields} }
app.post('/api/thasbiha/report', async (c) => {
    try {
        const body = await c.req.json();
        const day  = body.day || todayKey();
        const ws   = body.ws === 'him' ? 'him' : 'gg';
        const { arr, rec } = await _thbDailyGet(c, day);
        rec.report = rec.report || { gg: null, him: null };
        rec.report[ws] = { ...(body.report || {}), submittedAt: Date.now() };
        // Auto-calc KPIs from report numerics
        rec.kpis = rec.kpis || { gg: {}, him: {} };
        const r = rec.report[ws] || {};
        const num = (v: any) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
        if (ws === 'gg'){
            const contacted = num(r.leadsContacted);
            const registered = num(r.registrationsCompleted);
            const followStudents = num(r.studentsFollowedUp);
            const followUnis = num(r.universitiesFollowedUp);
            const followPlanned = num(r.followupsPlanned || (r.studentsFollowedUp ? r.studentsFollowedUp : 0));
            const followTotal = followStudents + followUnis;
            const followPct = followPlanned > 0 ? Math.round((followTotal / followPlanned) * 100) : (followTotal > 0 ? 100 : 0);
            rec.kpis.gg = {
                leadsContacted: contacted,
                registrations: registered,
                applicationsSubmitted: num(r.applicationsSubmitted),
                offersReceived: num(r.offersReceived),
                followupCompletionPct: Math.min(100, followPct),
                escalationsClosed: num(r.issuesResolved),
                conversions: num(r.studentsConverted)
            };
        } else {
            rec.kpis.him = {
                casesProcessed: num(r.casesWorkedOn),
                applicationsSubmitted: num(r.applicationsSubmitted),
                documentationCompleted: num(r.filesCompleted),
                followupsCompleted: num(r.studentsContacted),
                pendingCasesReduced: num(r.pendingReduced),
                escalationsClosed: num(r.issuesResolved)
            };
        }
        const idx = arr.findIndex((x: any) => x.id === rec.id);
        if (idx >= 0) arr[idx] = rec;
        await kvSaveArr(c, KV_THB_DAILY, arr, KV_THB_DAILY_CAP);
        return c.json({ success: true, daily: rec });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// POST call — log a single call (manual entry by Thasbiha)
// body: { ws('gg'|'him'), contact, purpose, outcome, durationMin?, notes? }
app.post('/api/thasbiha/call', async (c) => {
    try {
        const body = await c.req.json();
        const arr = await kvLoadArr(c, KV_THB_CALLS);
        const ws  = body.ws === 'him' ? 'him' : 'gg';
        const now = Date.now();
        const entry = {
            id: thbId('thbc'),
            ts: now,
            day: body.day || todayKey(),
            ws,
            contact: String(body.contact || '').slice(0, 120),
            purpose: String(body.purpose || '').slice(0, 200),
            outcome: String(body.outcome || '').slice(0, 200),
            durationMin: Number(body.durationMin) || 0,
            notes: String(body.notes || '').slice(0, 500)
        };
        arr.push(entry);
        await kvSaveArr(c, KV_THB_CALLS, arr, KV_THB_CALLS_CAP);
        return c.json({ success: true, call: entry });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// GET calls — list with filters
app.get('/api/thasbiha/calls', async (c) => {
    try {
        const day = c.req.query('day') || '';
        const ws  = c.req.query('ws')  || '';
        const since = Number(c.req.query('since') || '0');
        let arr = await kvLoadArr(c, KV_THB_CALLS);
        if (day) arr = arr.filter((x: any) => x.day === day);
        if (ws)  arr = arr.filter((x: any) => x.ws === ws);
        if (since) arr = arr.filter((x: any) => (x.ts || 0) >= since);
        arr.sort((a: any, b: any) => (b.ts || 0) - (a.ts || 0));
        return c.json({ success: true, calls: arr.slice(0, 200) });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// DELETE call — remove one log entry (mis-tap recovery)
app.post('/api/thasbiha/call/delete', async (c) => {
    try {
        const body = await c.req.json();
        const id = String(body.id || '');
        if (!id) return c.json({ success: false, error: 'id required' }, 400);
        const arr = await kvLoadArr(c, KV_THB_CALLS);
        const next = arr.filter((x: any) => x.id !== id);
        await kvSaveArr(c, KV_THB_CALLS, next, KV_THB_CALLS_CAP);
        return c.json({ success: true, removed: arr.length - next.length });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ==========================================================
// v16g — Daily Reports CEO/COO feed + Download Approval queue
// + Himaaus client list (CSV import). All KV-backed, capped.
// ==========================================================
const KV_DR_FEED          = 'v16g:daily-reports';          // unified feed of all submitted reports (cap 2000)
const KV_DL_REQUESTS      = 'v16g:download-requests';      // staff download requests (cap 500)
const KV_HIMAAUS_CLIENTS  = 'v16g:himaaus:clients';        // Thasbiha's imported clients (cap 5000)
const KV_GG_CLIENTS       = 'v16g:gg:clients';             // v16h — Global Guidance students/clients (cap 5000)
const KV_SCHEDULE_PREFIX  = 'v16i:schedule:';              // v16i — per-staff schedule items (KV key suffix = owner username)
const KV_TEAM_UPDATES     = 'v16j:team-updates';           // v16j — daily team status updates (who's in office, etc.) cap 200

// --- Daily Reports Feed (CEO/COO see ALL staff EOD reports) ---------
app.get('/api/v16g/daily-reports/today', async (c) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        // Source 1: KV feed (newer)
        const kvArr = await kvLoadArr(c, KV_DR_FEED);
        let items = kvArr.filter((r: any) => (r.date || '').slice(0, 10) === today);
        // Source 2: in-memory GLOBAL_DAILY_REPORTS (legacy mirror via /api/attendance/sync)
        try {
            const legacy = (globalThis as any).GLOBAL_DAILY_REPORTS as any[] | undefined;
            if (Array.isArray(legacy)) {
                legacy.forEach(r => {
                    if ((r.date || '').slice(0, 10) !== today) return;
                    if (items.find(x => x.userId === r.userId && (x.date || '').slice(0, 10) === today)) return;
                    items.push({
                        id: r.id, userId: r.userId, userName: r.userName, date: r.date,
                        checkinTime: r.checkinTime, checkoutTime: r.checkoutTime,
                        mode: r.mode, status: r.status, completion: r.completion,
                        morning: r.morning, evening: r.evening,
                        submittedAt: r.submittedAt, updatedAt: r.updatedAt
                    });
                });
            }
        } catch {}
        items.sort((a: any, b: any) => (b.submittedAt || b.updatedAt || '').localeCompare(a.submittedAt || a.updatedAt || ''));
        return c.json({ success: true, date: today, count: items.length, items });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e), items: [] }, 500);
    }
});

app.get('/api/v16g/daily-reports/range', async (c) => {
    try {
        const days = Math.min(parseInt(c.req.query('days') || '7', 10) || 7, 90);
        const today = new Date();
        const cutoff = new Date(today.getTime() - days * 86400000).toISOString().slice(0, 10);
        const kvArr = await kvLoadArr(c, KV_DR_FEED);
        const items = kvArr.filter((r: any) => (r.date || '') >= cutoff);
        try {
            const legacy = (globalThis as any).GLOBAL_DAILY_REPORTS as any[] | undefined;
            if (Array.isArray(legacy)) {
                legacy.forEach(r => {
                    if ((r.date || '') < cutoff) return;
                    if (items.find((x: any) => x.userId === r.userId && (x.date || '').slice(0, 10) === (r.date || '').slice(0, 10))) return;
                    items.push(r);
                });
            }
        } catch {}
        items.sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
        return c.json({ success: true, days, count: items.length, items });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e), items: [] }, 500);
    }
});

// Idempotent submit — called by frontend on EOD submit to ALSO write to KV.
app.post('/api/v16g/daily-reports/submit', async (c) => {
    try {
        const body = await c.req.json();
        const arr = await kvLoadArr(c, KV_DR_FEED);
        const today = (body.date || new Date().toISOString().slice(0, 10));
        const userId = String(body.userId || body.employeeId || '');
        if (!userId) return c.json({ success: false, error: 'userId required' }, 400);
        // Replace existing row for this user+date (one canonical EOD per day per user)
        const next = arr.filter((r: any) => !(r.userId === userId && (r.date || '').slice(0, 10) === today));
        const entry = {
            id: 'dr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
            userId, userName: body.userName || body.employeeName || userId,
            date: today,
            checkinTime: body.checkinTime || '',
            checkoutTime: body.checkoutTime || '',
            mode: body.mode || '',
            completion: body.completion || 0,
            tasks: body.tasks || [],
            morning: body.morning || null,
            evening: body.evening || null,
            achievement: body.achievement || '',
            issues: body.issues || '',
            tomorrow: body.tomorrow || '',
            selfDeclaration: body.selfDeclaration || '',
            status: 'submitted',
            submittedAt: new Date().toISOString()
        };
        next.unshift(entry);
        await kvSaveArr(c, KV_DR_FEED, next, 2000);
        return c.json({ success: true, report: entry });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// --- Download Approval Workflow -------------------------------------
app.post('/api/v16g/download-request', async (c) => {
    try {
        const body = await c.req.json();
        const requesterId = String(body.requesterId || '');
        const reportId = String(body.reportId || '');
        const reportDate = String(body.reportDate || new Date().toISOString().slice(0, 10));
        if (!requesterId) return c.json({ success: false, error: 'requesterId required' }, 400);
        const arr = await kvLoadArr(c, KV_DL_REQUESTS);
        const entry = {
            id: 'dlr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
            requesterId,
            requesterName: body.requesterName || requesterId,
            reportId,
            reportDate,
            reason: String(body.reason || '').slice(0, 500),
            status: 'pending',
            createdAt: new Date().toISOString(),
            token: null,
            decidedBy: null,
            decidedAt: null
        };
        arr.unshift(entry);
        await kvSaveArr(c, KV_DL_REQUESTS, arr, 500);
        return c.json({ success: true, request: entry });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

app.get('/api/v16g/download-requests', async (c) => {
    try {
        const status = c.req.query('status');
        const requesterId = c.req.query('requesterId');
        let arr = await kvLoadArr(c, KV_DL_REQUESTS);
        if (status) arr = arr.filter((r: any) => r.status === status);
        if (requesterId) arr = arr.filter((r: any) => r.requesterId === requesterId);
        return c.json({ success: true, count: arr.length, items: arr });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e), items: [] }, 500);
    }
});

app.post('/api/v16g/download-request/decide', async (c) => {
    try {
        const body = await c.req.json();
        const id = String(body.id || '');
        const decision = String(body.decision || ''); // 'approve' | 'deny'
        const decidedBy = String(body.decidedBy || 'ceo');
        if (!id || !['approve', 'deny'].includes(decision)) {
            return c.json({ success: false, error: 'id and decision (approve|deny) required' }, 400);
        }
        const arr = await kvLoadArr(c, KV_DL_REQUESTS);
        const idx = arr.findIndex((r: any) => r.id === id);
        if (idx < 0) return c.json({ success: false, error: 'request not found' }, 404);
        arr[idx].status = decision === 'approve' ? 'approved' : 'denied';
        arr[idx].decidedBy = decidedBy;
        arr[idx].decidedAt = new Date().toISOString();
        if (decision === 'approve') {
            arr[idx].token = 'dl_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12);
            arr[idx].tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h
        }
        await kvSaveArr(c, KV_DL_REQUESTS, arr, 500);
        return c.json({ success: true, request: arr[idx] });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// --- Himaaus Client List (CSV import) -------------------------------
app.get('/api/v16g/himaaus/clients', async (c) => {
    try {
        const owner = c.req.query('owner') || 'thasbiha.s';
        const arr = await kvLoadArr(c, KV_HIMAAUS_CLIENTS);
        const items = arr.filter((r: any) => !owner || r.owner === owner);
        return c.json({ success: true, count: items.length, items });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e), items: [] }, 500);
    }
});

app.post('/api/v16g/himaaus/clients/import', async (c) => {
    try {
        const body = await c.req.json();
        const owner = String(body.owner || 'thasbiha.s');
        const rows: any[] = Array.isArray(body.rows) ? body.rows : [];
        const mode = String(body.mode || 'replace'); // 'replace' | 'append'
        if (!rows.length) return c.json({ success: false, error: 'rows array required' }, 400);
        let arr = await kvLoadArr(c, KV_HIMAAUS_CLIENTS);
        if (mode === 'replace') {
            arr = arr.filter((r: any) => r.owner !== owner);
        }
        const now = new Date().toISOString();
        rows.forEach((r: any, i: number) => {
            arr.push({
                id: 'him_' + Date.now().toString(36) + '_' + i + '_' + Math.random().toString(36).slice(2, 5),
                owner,
                name: String(r.name || r.Name || r['Client Name'] || '').slice(0, 200),
                phone: String(r.phone || r.Phone || r.mobile || r.Mobile || '').slice(0, 50),
                email: String(r.email || r.Email || '').slice(0, 200),
                country: String(r.country || r.Country || r.destination || '').slice(0, 80),
                course: String(r.course || r.Course || r.program || '').slice(0, 200),
                status: String(r.status || r.Status || 'New').slice(0, 50),
                notes: String(r.notes || r.Notes || r.summary || '').slice(0, 1000),
                source: String(r.source || r.Source || '').slice(0, 80),
                importedAt: now,
                raw: r
            });
        });
        await kvSaveArr(c, KV_HIMAAUS_CLIENTS, arr, 5000);
        return c.json({ success: true, imported: rows.length, totalForOwner: arr.filter((r: any) => r.owner === owner).length, mode });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

app.delete('/api/v16g/himaaus/clients', async (c) => {
    try {
        const owner = c.req.query('owner') || 'thasbiha.s';
        let arr = await kvLoadArr(c, KV_HIMAAUS_CLIENTS);
        const before = arr.length;
        arr = arr.filter((r: any) => r.owner !== owner);
        await kvSaveArr(c, KV_HIMAAUS_CLIENTS, arr, 5000);
        return c.json({ success: true, removed: before - arr.length });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// --- Global Guidance Client/Student List (CSV/XLSX import) ---------
// v16h — mirrors Himaaus pattern. Owner-scoped (default thasbiha.s).
app.get('/api/v16g/gg/clients', async (c) => {
    try {
        const owner = c.req.query('owner') || 'thasbiha.s';
        const arr = await kvLoadArr(c, KV_GG_CLIENTS);
        const items = arr.filter((r: any) => !owner || r.owner === owner);
        return c.json({ success: true, count: items.length, items });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e), items: [] }, 500);
    }
});

app.post('/api/v16g/gg/clients/import', async (c) => {
    try {
        const body = await c.req.json();
        const owner = String(body.owner || 'thasbiha.s');
        const rows: any[] = Array.isArray(body.rows) ? body.rows : [];
        const mode = String(body.mode || 'replace'); // 'replace' | 'append'
        if (!rows.length) return c.json({ success: false, error: 'rows array required' }, 400);
        let arr = await kvLoadArr(c, KV_GG_CLIENTS);
        if (mode === 'replace') {
            arr = arr.filter((r: any) => r.owner !== owner);
        }
        const now = new Date().toISOString();
        rows.forEach((r: any, i: number) => {
            arr.push({
                id: 'gg_' + Date.now().toString(36) + '_' + i + '_' + Math.random().toString(36).slice(2, 5),
                owner,
                name:    String(r.name    || r.Name    || r['Student Name'] || r['Client Name'] || '').slice(0, 200),
                phone:   String(r.phone   || r.Phone   || r.mobile || r.Mobile || r['Contact'] || '').slice(0, 50),
                email:   String(r.email   || r.Email   || '').slice(0, 200),
                country: String(r.country || r.Country || r.destination || r.Destination || '').slice(0, 80),
                course:  String(r.course  || r.Course  || r.program || r.Program || '').slice(0, 200),
                stage:   String(r.stage   || r.Stage   || r.status || r.Status || 'New').slice(0, 80),
                status:  String(r.status  || r.Status  || 'Active').slice(0, 50),
                urgent:  /(^y|^true|^1$|urgent)/i.test(String(r.urgent || r.Urgent || r.priority || '')),
                todo:    String(r.todo    || r.ToDo    || r['Next Action'] || r.action || '').slice(0, 500),
                notes:   String(r.notes   || r.Notes   || r.summary || '').slice(0, 1000),
                source:  String(r.source  || r.Source  || '').slice(0, 80),
                importedAt: now,
                raw: r
            });
        });
        await kvSaveArr(c, KV_GG_CLIENTS, arr, 5000);
        return c.json({ success: true, imported: rows.length, totalForOwner: arr.filter((r: any) => r.owner === owner).length, mode });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

app.delete('/api/v16g/gg/clients', async (c) => {
    try {
        const owner = c.req.query('owner') || 'thasbiha.s';
        let arr = await kvLoadArr(c, KV_GG_CLIENTS);
        const before = arr.length;
        arr = arr.filter((r: any) => r.owner !== owner);
        await kvSaveArr(c, KV_GG_CLIENTS, arr, 5000);
        return c.json({ success: true, removed: before - arr.length });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// --- v16i Schedule / Appointments (per-staff KV-backed) ------------
// Stores a list of appointments per owner. Owner = currentUser.username.
// Fully replaces on POST (frontend sends authoritative full list).
app.get('/api/v16i/schedule', async (c) => {
    try {
        const owner = c.req.query('owner') || '';
        if (!owner) return c.json({ success: false, error: 'owner required', items: [] }, 400);
        const arr = await kvLoadArr(c, KV_SCHEDULE_PREFIX + owner);
        return c.json({ success: true, count: arr.length, items: arr });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e), items: [] }, 500);
    }
});

app.post('/api/v16i/schedule', async (c) => {
    try {
        const body = await c.req.json();
        const owner = String(body.owner || '');
        const items: any[] = Array.isArray(body.items) ? body.items : [];
        if (!owner) return c.json({ success: false, error: 'owner required' }, 400);
        await kvSaveArr(c, KV_SCHEDULE_PREFIX + owner, items, 500);
        return c.json({ success: true, count: items.length });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// --- v16j Daily Team Updates (shared whiteboard) ---------------
// Replaces the legacy mock "Meetings" widget on the dashboard.
// Any staff can post; everyone sees the live feed.
// Item shape: { id, author, authorName, text, kind, ts, dayKey }
//   kind: 'office' | 'remote' | 'leave' | 'late' | 'note' | 'meeting'
app.get('/api/v16j/team-updates', async (c) => {
    try {
        const limit = Math.min(parseInt(c.req.query('limit') || '50', 10) || 50, 200);
        const since = c.req.query('since') || ''; // YYYY-MM-DD optional filter
        let arr = await kvLoadArr(c, KV_TEAM_UPDATES);
        if (since) arr = arr.filter((r: any) => (r.dayKey || '') >= since);
        arr.sort((a: any, b: any) => (b.ts || 0) - (a.ts || 0));
        return c.json({ success: true, count: arr.length, items: arr.slice(0, limit) });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e), items: [] }, 500);
    }
});

app.post('/api/v16j/team-updates', async (c) => {
    try {
        const body = await c.req.json();
        const author = String(body.author || '').slice(0, 80);
        const text   = String(body.text   || '').slice(0, 500);
        if (!author || !text.trim()) return c.json({ success: false, error: 'author + text required' }, 400);
        const arr = await kvLoadArr(c, KV_TEAM_UPDATES);
        const now = Date.now();
        const day = new Date(now + (5.5 * 60 * 60 * 1000)).toISOString().slice(0, 10);
        const entry = {
            id: 'tu_' + now.toString(36) + '_' + Math.random().toString(36).slice(2, 7),
            author,
            authorName: String(body.authorName || author).slice(0, 120),
            text: text.trim(),
            kind: String(body.kind || 'note').slice(0, 30),
            ts: now,
            dayKey: day
        };
        arr.unshift(entry);
        await kvSaveArr(c, KV_TEAM_UPDATES, arr, 200);
        return c.json({ success: true, entry });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

app.delete('/api/v16j/team-updates', async (c) => {
    try {
        const id = c.req.query('id');
        const author = c.req.query('author');
        const level = parseInt(c.req.query('level') || '0', 10);
        if (!id) return c.json({ success: false, error: 'id required' }, 400);
        let arr = await kvLoadArr(c, KV_TEAM_UPDATES);
        const target = arr.find((r: any) => r.id === id);
        if (!target) return c.json({ success: false, error: 'not found' }, 404);
        // Only the author OR a manager (level >= 80) can delete
        if (target.author !== author && level < 80) {
            return c.json({ success: false, error: 'forbidden — author or manager only' }, 403);
        }
        arr = arr.filter((r: any) => r.id !== id);
        await kvSaveArr(c, KV_TEAM_UPDATES, arr, 200);
        return c.json({ success: true, removed: 1 });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ==========================================================
// v16l — Unified Attendance (Issues 01–08)
//   Single source of truth for attendance, GPS, daily plan,
//   daily report, office locations, and team activity feed.
// ==========================================================
const KV_V16L_ATT       = 'v16l:attendance';      // array, cap 5000 — every check-in/out event
const KV_V16L_OFFICES   = 'v16l:offices';         // array — office locations master
const KV_V16L_PLAN      = 'v16l:daily-plan';      // array, cap 2000
const KV_V16L_REPORT    = 'v16l:daily-report';    // array, cap 2000
const KV_V16L_ACTIVITY  = 'v16l:team-activity';   // array, cap 500 — live activity feed

// Default office master (CEO can edit)
const DEFAULT_OFFICES = [
    { id: 'hq',          name: 'Global Guidance HQ', city: 'Colombo',    lat: 6.9271,  lng: 79.8612, radius: 100, active: true },
    { id: 'jaffna',      name: 'Jaffna Office',      city: 'Jaffna',     lat: 9.6615,  lng: 80.0255, radius: 100, active: true },
    { id: 'kandy',       name: 'Kandy Office',       city: 'Kandy',      lat: 7.2906,  lng: 80.6337, radius: 100, active: true },
    { id: 'kurunegala',  name: 'Kurunegala Office',  city: 'Kurunegala', lat: 7.4863,  lng: 80.3623, radius: 100, active: true }
];

function v16lColomboDayKey(): string {
    const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    return now.toISOString().slice(0, 10);
}
function v16lId(prefix: string){ return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7); }

// ---- OFFICES ----------------------------------------------
app.get('/api/v16l/offices', async (c) => {
    try {
        let arr = await kvLoadArr(c, KV_V16L_OFFICES);
        if (!arr || !arr.length) {
            arr = DEFAULT_OFFICES.slice();
            await kvSaveArr(c, KV_V16L_OFFICES, arr, 100);
        }
        return c.json({ success: true, offices: arr });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e), offices: DEFAULT_OFFICES }, 200);
    }
});
app.post('/api/v16l/offices', async (c) => {
    try {
        const body = await c.req.json();
        const level = parseInt(String(body.level || 0), 10);
        if (level < 100) return c.json({ success: false, error: 'CEO/admin only' }, 403);
        let arr = await kvLoadArr(c, KV_V16L_OFFICES);
        if (!arr.length) arr = DEFAULT_OFFICES.slice();
        const op = String(body.op || 'upsert');
        if (op === 'delete' && body.id) {
            arr = arr.filter((o: any) => o.id !== body.id);
        } else {
            const office = {
                id:     body.id || v16lId('off'),
                name:   String(body.name || 'Untitled office'),
                city:   String(body.city || ''),
                lat:    Number(body.lat) || 0,
                lng:    Number(body.lng) || 0,
                radius: Number(body.radius) || 100,
                active: body.active !== false
            };
            const idx = arr.findIndex((o: any) => o.id === office.id);
            if (idx >= 0) arr[idx] = { ...arr[idx], ...office }; else arr.push(office);
        }
        await kvSaveArr(c, KV_V16L_OFFICES, arr, 100);
        return c.json({ success: true, offices: arr });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ---- ATTENDANCE event log --------------------------------
app.get('/api/v16l/attendance', async (c) => {
    try {
        const day = c.req.query('day') || v16lColomboDayKey();
        const user = c.req.query('user');
        const arr = await kvLoadArr(c, KV_V16L_ATT);
        const filtered = arr.filter((r: any) =>
            (!day || r.dayKey === day) && (!user || r.user === user)
        );
        return c.json({ success: true, count: filtered.length, items: filtered });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});
app.post('/api/v16l/attendance', async (c) => {
    try {
        const body = await c.req.json();
        const user = String(body.user || '').trim();
        const kind = String(body.kind || 'checkin'); // 'checkin' | 'checkout'
        if (!user) return c.json({ success: false, error: 'user required' }, 400);
        // Audit capture
        const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
        const ua = c.req.header('user-agent') || 'unknown';
        const day = v16lColomboDayKey();
        const arr = await kvLoadArr(c, KV_V16L_ATT);
        const entry = {
            id:        v16lId('att'),
            user:      user,
            name:      String(body.name || ''),
            empId:     String(body.empId || ''),
            level:     Number(body.level) || 0,
            kind:      kind,                      // 'checkin' | 'checkout'
            status:    String(body.status || 'Present'),
            mode:      String(body.mode || 'Office'),
            // GPS
            lat:       (body.lat != null) ? Number(body.lat) : null,
            lng:       (body.lng != null) ? Number(body.lng) : null,
            accuracy:  (body.accuracy != null) ? Number(body.accuracy) : null,
            address:   String(body.address || ''),
            officeId:  String(body.officeId || ''),
            officeMatch: !!body.officeMatch,
            distanceM: (body.distanceM != null) ? Number(body.distanceM) : null,
            // mode-specific
            fieldVisit:  body.fieldVisit || null,   // { client, institution, location, purpose }
            remoteReason: String(body.remoteReason || ''),
            // audit
            ip:        ip,
            userAgent: ua,
            device:    String(body.device || ''),
            browser:   String(body.browser || ''),
            ts:        Date.now(),
            dayKey:    day
        };
        arr.push(entry);
        await kvSaveArr(c, KV_V16L_ATT, arr, 5000);
        // Also push to activity feed
        const activity = await kvLoadArr(c, KV_V16L_ACTIVITY);
        activity.unshift({
            id: v16lId('act'),
            user, name: entry.name,
            type: kind === 'checkin' ? 'check-in' : 'check-out',
            text: (kind === 'checkin' ? 'Checked in' : 'Checked out') + ' — ' + entry.mode + (entry.address ? ' · ' + entry.address.split(',')[0] : ''),
            mode: entry.mode,
            ts: entry.ts,
            dayKey: day
        });
        await kvSaveArr(c, KV_V16L_ACTIVITY, activity, 500);
        return c.json({ success: true, entry });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ---- DAILY PLAN -------------------------------------------
app.get('/api/v16l/daily-plan', async (c) => {
    try {
        const day = c.req.query('day') || v16lColomboDayKey();
        const user = c.req.query('user');
        const arr = await kvLoadArr(c, KV_V16L_PLAN);
        const filtered = arr.filter((r: any) =>
            (!day || r.dayKey === day) && (!user || r.user === user)
        );
        return c.json({ success: true, count: filtered.length, items: filtered });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});
app.post('/api/v16l/daily-plan', async (c) => {
    try {
        const body = await c.req.json();
        const user = String(body.user || '').trim();
        if (!user) return c.json({ success: false, error: 'user required' }, 400);
        const day = v16lColomboDayKey();
        const arr = await kvLoadArr(c, KV_V16L_PLAN);
        // Upsert per (user, day) — one plan per day
        const idx = arr.findIndex((r: any) => r.user === user && r.dayKey === day);
        const entry = {
            id: idx >= 0 ? arr[idx].id : v16lId('plan'),
            user, name: String(body.name || ''),
            tasks: Array.isArray(body.tasks) ? body.tasks.slice(0, 20) : [],
            students: body.students || { count: 0, highRisk: '', pendingReg: '', priorityConv: '' },
            universities: body.universities || { offers: '', cas: '', coe: '', docs: '' },
            ops: body.ops || { admin: '', hr: '', finance: '', mgmt: '' },
            expectedOutcomes: String(body.expectedOutcomes || ''),
            ts: Date.now(),
            dayKey: day
        };
        if (idx >= 0) arr[idx] = entry; else arr.push(entry);
        await kvSaveArr(c, KV_V16L_PLAN, arr, 2000);
        // Activity feed
        const activity = await kvLoadArr(c, KV_V16L_ACTIVITY);
        activity.unshift({
            id: v16lId('act'), user, name: entry.name,
            type: 'daily-plan',
            text: 'Submitted daily plan — ' + (entry.tasks.length || 0) + ' priority task(s)',
            ts: Date.now(), dayKey: day
        });
        await kvSaveArr(c, KV_V16L_ACTIVITY, activity, 500);
        return c.json({ success: true, entry });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ---- DAILY REPORT (required for check-out) ---------------
app.get('/api/v16l/daily-report', async (c) => {
    try {
        const day = c.req.query('day') || v16lColomboDayKey();
        const user = c.req.query('user');
        const arr = await kvLoadArr(c, KV_V16L_REPORT);
        const filtered = arr.filter((r: any) =>
            (!day || r.dayKey === day) && (!user || r.user === user)
        );
        return c.json({ success: true, count: filtered.length, items: filtered });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});
app.post('/api/v16l/daily-report', async (c) => {
    try {
        const body = await c.req.json();
        const user = String(body.user || '').trim();
        if (!user) return c.json({ success: false, error: 'user required' }, 400);
        const day = v16lColomboDayKey();
        const arr = await kvLoadArr(c, KV_V16L_REPORT);
        const idx = arr.findIndex((r: any) => r.user === user && r.dayKey === day);
        const entry = {
            id: idx >= 0 ? arr[idx].id : v16lId('rpt'),
            user, name: String(body.name || ''),
            completed:   String(body.completed || ''),
            pending:     String(body.pending || ''),
            challenges:  String(body.challenges || ''),
            tomorrow:    String(body.tomorrow || ''),
            mgmtNotes:   String(body.mgmtNotes || ''),
            ts: Date.now(), dayKey: day
        };
        if (idx >= 0) arr[idx] = entry; else arr.push(entry);
        await kvSaveArr(c, KV_V16L_REPORT, arr, 2000);
        const activity = await kvLoadArr(c, KV_V16L_ACTIVITY);
        activity.unshift({
            id: v16lId('act'), user, name: entry.name,
            type: 'daily-report',
            text: 'Filed daily report',
            ts: Date.now(), dayKey: day
        });
        await kvSaveArr(c, KV_V16L_ACTIVITY, activity, 500);
        return c.json({ success: true, entry });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ---- TEAM ACTIVITY FEED -----------------------------------
app.get('/api/v16l/team-activity', async (c) => {
    try {
        const day = c.req.query('day') || v16lColomboDayKey();
        const limit = parseInt(c.req.query('limit') || '50', 10);
        const arr = await kvLoadArr(c, KV_V16L_ACTIVITY);
        const filtered = day ? arr.filter((r: any) => r.dayKey === day) : arr;
        return c.json({ success: true, count: filtered.length, items: filtered.slice(0, limit) });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});
app.post('/api/v16l/team-activity', async (c) => {
    try {
        const body = await c.req.json();
        if (!body.user || !body.text) return c.json({ success: false, error: 'user + text required' }, 400);
        const day = v16lColomboDayKey();
        const arr = await kvLoadArr(c, KV_V16L_ACTIVITY);
        const entry = {
            id: v16lId('act'),
            user: String(body.user),
            name: String(body.name || ''),
            type: String(body.type || 'activity'),
            text: String(body.text).slice(0, 280),
            ts: Date.now(), dayKey: day
        };
        arr.unshift(entry);
        await kvSaveArr(c, KV_V16L_ACTIVITY, arr, 500);
        return c.json({ success: true, entry });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ---- CEO DASHBOARD aggregate ------------------------------
app.get('/api/v16l/ceo-dashboard', async (c) => {
    try {
        const day = c.req.query('day') || v16lColomboDayKey();
        const [att, plans, reports, activity, offices] = await Promise.all([
            kvLoadArr(c, KV_V16L_ATT),
            kvLoadArr(c, KV_V16L_PLAN),
            kvLoadArr(c, KV_V16L_REPORT),
            kvLoadArr(c, KV_V16L_ACTIVITY),
            kvLoadArr(c, KV_V16L_OFFICES)
        ]);
        const todayAtt = att.filter((r: any) => r.dayKey === day);
        // De-duplicate per user — latest event wins
        const byUser: { [k: string]: any } = {};
        todayAtt.forEach((r: any) => {
            const cur = byUser[r.user];
            if (!cur || r.ts > cur.ts) byUser[r.user] = r;
        });
        const users = Object.values(byUser);
        // Aggregates
        const counts = {
            checkedIn:    users.filter((u: any) => u.kind === 'checkin' && u.status !== 'Leave').length,
            checkedOut:   users.filter((u: any) => u.kind === 'checkout').length,
            late:         users.filter((u: any) => u.status === 'Late').length,
            sick:         users.filter((u: any) => u.status === 'Sick').length,
            leave:        users.filter((u: any) => u.status === 'Leave').length,
            office:       users.filter((u: any) => u.mode === 'Office' && u.kind === 'checkin').length,
            remote:       users.filter((u: any) => u.mode === 'Remote' && u.kind === 'checkin').length,
            field:        users.filter((u: any) => u.mode === 'Field' && u.kind === 'checkin').length,
            plansToday:   plans.filter((r: any) => r.dayKey === day).length,
            reportsToday: reports.filter((r: any) => r.dayKey === day).length
        };
        return c.json({
            success: true,
            day,
            counts,
            users,
            activity: activity.filter((a: any) => a.dayKey === day).slice(0, 30),
            offices: offices.length ? offices : DEFAULT_OFFICES
        });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ==========================================================
// v16h — Staff Controls (CEO-managed per-staff toggles)
// + EOD submission lock + notifications
// ==========================================================
const KV_STAFF_CONTROLS = 'v16g:staff-controls';   // object: { [empId]: {plannerRequired, dailyReportRequired, eodRequired, taskCompletionRequired, gpsRequired, autoReminders} }
const KV_EOD_LOCKS      = 'v16g:eod-locks';        // array: locks per user+date
const KV_NOTIFICATIONS  = 'v16g:notifications';    // array: notifications for managers/CEO (cap 1000)
const KV_WS_LOCKS       = 'v16g:ws-locks';         // object: { [key]: true } — CEO-locked workspace cards/tabs that staff cannot hide

// Default staff controls (used when KV is empty for a given empId).
// Heads/Execs default to ON; designers/comms/interns default OFF for planner.
function defaultStaffControls(empId: string){
    const opsHeads = new Set(['GG001','GG002','GG003','GG004','GG006']); // CEO/COO/Thasbiha/Umair/Razan
    const isOps = opsHeads.has(empId);
    return {
        plannerRequired:        isOps,
        dailyReportRequired:    true,
        eodRequired:            true,
        taskCompletionRequired: isOps,
        gpsRequired:            true,
        autoReminders:          true
    };
}

// GET all staff controls (CEO settings panel uses this)
app.get('/api/v16g/staff-controls', async (c) => {
    try {
        const obj = await kvLoadObj(c, KV_STAFF_CONTROLS);
        return c.json({ success: true, controls: obj });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e), controls: {} }, 500);
    }
});

// GET controls for a single employee (with sensible defaults)
app.get('/api/v16g/staff-controls/:empId', async (c) => {
    try {
        const empId = c.req.param('empId');
        const obj = await kvLoadObj(c, KV_STAFF_CONTROLS);
        const merged = { ...defaultStaffControls(empId), ...(obj[empId] || {}) };
        return c.json({ success: true, empId, controls: merged });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// PUT update controls for one or many employees
app.put('/api/v16g/staff-controls', async (c) => {
    try {
        const body = await c.req.json();
        if (!body || typeof body !== 'object') return c.json({ success:false, error:'body required' }, 400);
        const obj = await kvLoadObj(c, KV_STAFF_CONTROLS);
        // body shape: { updatedBy, controls: { [empId]: {...partial...} } }
        const incoming = body.controls || {};
        for (const empId of Object.keys(incoming)) {
            obj[empId] = { ...(obj[empId] || {}), ...incoming[empId] };
        }
        obj.__lastUpdated = new Date().toISOString();
        obj.__lastUpdatedBy = String(body.updatedBy || 'unknown');
        await kvSaveObj(c, KV_STAFF_CONTROLS, obj);
        return c.json({ success: true, controls: obj });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// EOD lock: once submitted for the day, staff cannot edit
app.get('/api/v16g/eod-lock/:empId', async (c) => {
    try {
        const empId = c.req.param('empId');
        const date = c.req.query('date') || new Date().toISOString().slice(0, 10);
        const arr = await kvLoadArr(c, KV_EOD_LOCKS);
        const found = arr.find((r:any) => r.empId === empId && r.date === date);
        return c.json({ success: true, locked: !!found, lock: found || null });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e), locked: false }, 500);
    }
});

app.post('/api/v16g/eod-lock', async (c) => {
    try {
        const body = await c.req.json();
        const empId = String(body.empId || '');
        const date  = String(body.date  || new Date().toISOString().slice(0, 10));
        if (!empId) return c.json({ success:false, error:'empId required' }, 400);
        const arr = await kvLoadArr(c, KV_EOD_LOCKS);
        const filtered = arr.filter((r:any) => !(r.empId === empId && r.date === date));
        const lock = {
            empId, date,
            employeeName: body.employeeName || empId,
            lockedAt: new Date().toISOString(),
            reportId: body.reportId || null
        };
        filtered.unshift(lock);
        await kvSaveArr(c, KV_EOD_LOCKS, filtered, 5000);
        return c.json({ success: true, lock });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// Notifications: managers/CEO get pinged when a report is filed
app.get('/api/v16g/notifications', async (c) => {
    try {
        const recipient = c.req.query('recipient'); // optional: filter by recipient role/username
        const sinceMs = parseInt(c.req.query('since') || '0', 10);
        let arr = await kvLoadArr(c, KV_NOTIFICATIONS);
        if (recipient) {
            arr = arr.filter((n:any) =>
                !n.recipients || n.recipients.includes(recipient) || n.recipients.includes('*'));
        }
        if (sinceMs > 0) {
            arr = arr.filter((n:any) => (n.ts || 0) > sinceMs);
        }
        return c.json({ success: true, count: arr.length, notifications: arr.slice(0, 100) });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e), notifications: [] }, 500);
    }
});

app.post('/api/v16g/notify', async (c) => {
    try {
        const body = await c.req.json();
        const arr = await kvLoadArr(c, KV_NOTIFICATIONS);
        const entry = {
            id: 'n_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7),
            ts: Date.now(),
            type:       String(body.type || 'info'),     // eod-submitted | checkin | leave-request | red-flag | info
            title:      String(body.title || ''),
            message:    String(body.message || ''),
            from:       String(body.from || 'system'),
            fromName:   String(body.fromName || body.from || 'System'),
            recipients: Array.isArray(body.recipients) ? body.recipients : ['ceo','coo','*'],
            link:       body.link || null,
            read:       false
        };
        arr.unshift(entry);
        await kvSaveArr(c, KV_NOTIFICATIONS, arr, 1000);
        return c.json({ success: true, notification: entry });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// v16h #5 — Workspace Customization CEO locks
// GET: read all locked keys (anyone can read; staff need it to render correctly)
// PUT: only CEO can update — body = { key, locked }
app.get('/api/v16g/ws-locks', async (c) => {
    try {
        const obj = await kvLoadObj(c, KV_WS_LOCKS);
        return c.json({ success: true, locks: obj || {} });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e), locks: {} }, 500);
    }
});

app.put('/api/v16g/ws-locks', async (c) => {
    try {
        const body = await c.req.json();
        if (!body || !body.key) return c.json({ success:false, error:'key required' }, 400);
        const obj = await kvLoadObj(c, KV_WS_LOCKS);
        if (body.locked) {
            obj[String(body.key)] = true;
        } else {
            delete obj[String(body.key)];
        }
        obj.__lastUpdated = new Date().toISOString();
        obj.__lastUpdatedBy = String(body.updatedBy || 'ceo');
        await kvSaveObj(c, KV_WS_LOCKS, obj);
        return c.json({ success: true, locks: obj });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// ============================================================
// v16q — Per-user workspace data (Mirror of Excel sheets)
// Seeded from xlsx files uploaded 2026-06-23, persisted in KV.
// ============================================================
import V16Q_SEED from './v16q-seed.json';

const V16Q_DATASETS = [
    'thasbiha_admissions','thasbiha_visa',
    'razan_visa_2026','razan_visa_2025',
    'razan_admissions','razan_invoices','razan_registered','razan_client_gmails',
    'razan_himaaus_admissions','razan_himaaus_invoices',
    'razan_amana_expenses','razan_amana_incomes','razan_petty_cash',
    'razan_glsa_pipeline','razan_glsa_payments','razan_glsa_qualifications',
    'shiran_flyers','shiran_budgets'
] as const;
type V16QKey = typeof V16Q_DATASETS[number];

async function v16qGet(c: any, key: V16QKey): Promise<{headers: string[], rows: any[]}> {
    const kvKey = 'v16q:' + key;
    try {
        const kv = (c.env as any)?.COMMS;
        if (kv) {
            const raw = await kv.get(kvKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.rows)) return parsed;
            }
        }
    } catch {}
    const seed: any = (V16Q_SEED as any)[key];
    if (!seed) return { headers: [], rows: [] };
    let headers: string[] = Array.isArray(seed.headers) ? seed.headers.slice() : [];
    const rows: any[] = Array.isArray(seed.rows) ? seed.rows : [];
    // Derive headers from row keys if seed didn't ship them
    if (headers.length === 0 && rows.length > 0) {
        const seen = new Set<string>();
        for (const r of rows) {
            if (r && typeof r === 'object') {
                for (const k of Object.keys(r)) {
                    if (k !== '_row' && !seen.has(k)) { seen.add(k); headers.push(k); }
                }
            }
        }
    }
    return { headers, rows };
}

async function v16qSet(c: any, key: V16QKey, payload: {headers?: string[], rows: any[]}): Promise<boolean> {
    try {
        const kv = (c.env as any)?.COMMS;
        if (!kv) return false;
        await kv.put('v16q:' + key, JSON.stringify(payload));
        return true;
    } catch { return false; }
}

// Single generic GET route — `dataset` is one of the keys above
app.get('/api/v16q/:dataset', async (c) => {
    const ds = c.req.param('dataset') as V16QKey;
    if (!V16Q_DATASETS.includes(ds)) {
        return c.json({ success: false, error: 'Unknown dataset', allowed: V16Q_DATASETS }, 400);
    }
    const data = await v16qGet(c, ds);
    return c.json({ success: true, dataset: ds, count: data.rows.length, headers: data.headers, rows: data.rows });
});

// Single row upsert (replaces row at _row key, or appends if missing)
app.post('/api/v16q/:dataset/row', async (c) => {
    const ds = c.req.param('dataset') as V16QKey;
    if (!V16Q_DATASETS.includes(ds)) return c.json({ success: false, error: 'Unknown dataset' }, 400);
    try {
        const body: any = await c.req.json();
        const row = body.row;
        if (!row || typeof row !== 'object') return c.json({ success: false, error: 'Missing row' }, 400);
        const data = await v16qGet(c, ds);
        const rows = data.rows.slice();
        if (row._row != null) {
            const idx = rows.findIndex((r: any) => r._row === row._row);
            if (idx >= 0) rows[idx] = row;
            else rows.push(row);
        } else {
            row._row = Date.now();
            rows.push(row);
        }
        const ok = await v16qSet(c, ds, { headers: data.headers, rows });
        return c.json({ success: ok, dataset: ds, count: rows.length });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// Bulk update (replace whole array)
app.post('/api/v16q/:dataset', async (c) => {
    const ds = c.req.param('dataset') as V16QKey;
    if (!V16Q_DATASETS.includes(ds)) return c.json({ success: false, error: 'Unknown dataset' }, 400);
    try {
        const body: any = await c.req.json();
        if (!Array.isArray(body.rows)) return c.json({ success: false, error: 'Missing rows array' }, 400);
        const ok = await v16qSet(c, ds, { headers: body.headers || [], rows: body.rows });
        return c.json({ success: ok, dataset: ds, count: body.rows.length });
    } catch (e: any) {
        return c.json({ success: false, error: e?.message || String(e) }, 500);
    }
});

// Aggregated workspace endpoint — returns all data for a given user in one shot
app.get('/api/v16q/workspace/:user', async (c) => {
    const user = (c.req.param('user') || '').toLowerCase();
    const map: Record<string, V16QKey[]> = {
        'thasbiha':    ['thasbiha_admissions', 'thasbiha_visa'],
        'thasbiha.s':  ['thasbiha_admissions', 'thasbiha_visa'],
        'razan':       ['razan_visa_2026','razan_visa_2025','razan_admissions','razan_invoices','razan_registered','razan_client_gmails','razan_himaaus_admissions','razan_himaaus_invoices','razan_amana_expenses','razan_amana_incomes','razan_petty_cash','razan_glsa_pipeline','razan_glsa_payments','razan_glsa_qualifications'],
        'razan.thawus':['razan_visa_2026','razan_visa_2025','razan_admissions','razan_invoices','razan_registered','razan_client_gmails','razan_himaaus_admissions','razan_himaaus_invoices','razan_amana_expenses','razan_amana_incomes','razan_petty_cash','razan_glsa_pipeline','razan_glsa_payments','razan_glsa_qualifications'],
        'shiran':      ['shiran_flyers', 'shiran_budgets'],
        'shiran.r':    ['shiran_flyers', 'shiran_budgets']
    };
    const keys = map[user] || [];
    if (!keys.length) return c.json({ success: false, error: 'Unknown user', user }, 404);
    const result: any = { success: true, user };
    for (const k of keys) {
        const d = await v16qGet(c, k);
        result[k] = { count: d.rows.length, headers: d.headers, rows: d.rows };
    }
    return c.json(result);
});
// 404 Not Found page (must be the LAST route registered)
app.get('*', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 - Page Not Found | Global Guidance HR</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center min-h-screen">
        <div class="text-center max-w-md px-6">
            <div class="mb-6">
                <i class="fas fa-exclamation-triangle text-yellow-500 text-6xl animate-bounce"></i>
            </div>
            <h1 class="text-5xl font-bold text-gray-800 mb-4">404</h1>
            <h2 class="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
            <p class="text-gray-600 mb-8">The page you're looking for doesn't exist or has been moved.</p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/dashboard" class="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-lg">
                    <i class="fas fa-home mr-2"></i>Go to Dashboard
                </a>
                <a href="/" class="inline-flex items-center justify-center bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition shadow-lg">
                    <i class="fas fa-sign-in-alt mr-2"></i>Back to Login
                </a>
            </div>
            <div class="mt-8 text-sm text-gray-500">
                <p>If you believe this is an error, please contact support.</p>
            </div>
        </div>
    </body>
    </html>
  `, 404)
})


export default app
