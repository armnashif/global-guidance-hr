#!/bin/bash

# List of module HTML files that need authentication
MODULES=(
    "daily-operations-enhanced.html"
    "lead-management-unified.html"
    "reports-analytics.html"
    "leave-management.html"
    "red-flags.html"
    "sheets-integration.html"
    "student-portal.html"
    "applications-visa.html"
    "finance-commission.html"
    "system-settings.html"
)

for module in "${MODULES[@]}"; do
    if [ -f "$module" ]; then
        echo "Processing $module..."
        
        # Check if shared-auth.js is already included
        if grep -q "shared-auth.js" "$module"; then
            echo "  ✓ Already has shared-auth.js"
        else
            echo "  + Adding shared-auth.js"
            # Add script before </body> tag
            sed -i 's|</body>|    <script src="/shared-auth.js"></script>\n    <script>\n        // Protect this page - redirect if not authenticated\n        protectPage();\n    </script>\n</body>|' "$module"
        fi
    else
        echo "  ✗ File not found: $module"
    fi
done

echo ""
echo "Authentication protection added to all module pages!"
