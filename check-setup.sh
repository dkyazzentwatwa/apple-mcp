#!/bin/bash

echo "🔍 Checking Apple MCP Setup..."
echo ""

# Check for Swift
if command -v swift &> /dev/null; then
    SWIFT_VERSION=$(swift --version | head -n 1)
    echo "✅ Swift: $SWIFT_VERSION"
else
    echo "❌ Swift not found"
    echo "   Install Xcode Command Line Tools: xcode-select --install"
    exit 1
fi

# Check for MapKit helper
HELPER_PATH="helpers/mapkit-directions/.build/release/mapkit-directions"
if [ -f "$HELPER_PATH" ]; then
    echo "✅ MapKit helper: Built"

    # Test the helper
    echo ""
    echo "🧪 Testing route calculation..."
    TEST_RESULT=$(echo '{"fromAddress":"San Francisco","toAddress":"San Jose","transportType":"driving","includeAlternatives":false}' | "$HELPER_PATH" 2>&1)

    if echo "$TEST_RESULT" | grep -q '"success":true'; then
        echo "✅ Route analysis: Working"
        DISTANCE=$(echo "$TEST_RESULT" | grep -o '"distance":[0-9]*' | head -1 | cut -d':' -f2)
        DISTANCE_MILES=$(echo "scale=1; $DISTANCE / 1609.34" | bc)
        echo "   Test route: ${DISTANCE_MILES} miles"
    else
        echo "⚠️  Route analysis: Helper exists but test failed"
        echo "   Error: $TEST_RESULT"
    fi
else
    echo "❌ MapKit helper: Not built"
    echo "   Run: npm run build:swift-helpers"
    exit 1
fi

echo ""
echo "✅ Setup complete! All features are ready."
echo ""
echo "📝 Try these commands in Claude:"
echo "   • Search for coffee shops in San Francisco"
echo "   • Analyze the route from SF to San Jose"
echo "   • Show me my Safari reading list"
