# 🛍️ Test Shop Button - ADDED! ✅

## 🎯 Feature Added:
**Test Shop Button**: A dedicated button to instantly open the shop menu for testing purposes, without needing to find shop tiles or reach shop floors.

## 🔧 Implementation Details:

### Button Location:
- **Position**: Far left of the bottom button row
- **Color**: Orange (#f39c12) to match shop theme
- **Text**: "TEST SHOP"
- **Size**: 18px font, consistent with other test buttons

### Button Layout:
```
[TEST SHOP] [TEST EVENT] [ROLL DICE] [SIMULATE TURN]
                    [ADVANCE FLOOR]
```

### Functionality:
- **Click**: Opens shop menu immediately
- **Message**: Shows "TEST: Opening shop menu!" before opening
- **Shop Type**: Opens regular shop (not special shop)
- **No Requirements**: Works regardless of current floor or position

## 🎮 How to Use:

### Testing Regular Shop:
1. **Click "TEST SHOP"** button
2. **Shop opens** with regular items:
   - Healing Potion (15 coins)
   - Antidote (25 coins)
3. **Test purchases** with current coin balance
4. **Test affordability** - items show green/red based on coins

### Testing Special Shop:
1. **Click "ADVANCE FLOOR"** to reach floor 4, 8, or 12
2. **Click "TEST SHOP"** button
3. **Shop opens** with special items:
   - Healing Potion (15 coins)
   - Antidote (25 coins)
   - Stat Upgrade (50 coins) *Special only*
   - Blessing Scroll (75 coins) *Special only*

### Testing Purchase Protection:
1. **Start with various coin amounts** (low/high)
2. **Click "TEST SHOP"** to open shop
3. **Try purchasing items** you can/cannot afford
4. **Verify error messages** for insufficient funds
5. **Check coin balances** remain correct

## 🧪 Testing Scenarios:

### Scenario 1: Low Coins (< 15)
```
Player has 10 coins → Click "TEST SHOP"
- All items show RED text (unaffordable)
- Clicking any item shows "Not enough coins!"
- Coin balance remains 10
```

### Scenario 2: Medium Coins (15-50)
```
Player has 30 coins → Click "TEST SHOP"
- Healing Potion: GREEN (affordable)
- Antidote: GREEN (affordable)
- Stat Upgrade: RED (unaffordable, if special shop)
- Can purchase healing/antidote successfully
```

### Scenario 3: High Coins (75+)
```
Player has 100 coins → Click "TEST SHOP"
- All items show GREEN text (affordable)
- Can purchase any item successfully
- Purchase confirmations show remaining coins
- Multiple purchases work correctly
```

## 🔧 Technical Implementation:

### Button Creation:
```typescript
const testShopButton = this.add.text(centerX - 250, bottomY, "TEST SHOP", {
  fontSize: "18px",
  color: "#f39c12", // Orange shop color
  fontFamily: "Courier New, monospace",
  backgroundColor: "#16213e",
  padding: { x: 15, y: 8 },
}).setOrigin(0.5).setInteractive();
```

### Button Handler:
```typescript
private testShop() {
  this.showMessage("TEST: Opening shop menu!", "#f39c12");
  this.time.delayedCall(1500, () => {
    this.showShopMenu(); // Opens regular shop
  });
}
```

## 🎯 Benefits for Testing:

### Quick Access:
- **No setup required** - works from any game state
- **Instant shop access** - no need to find shop tiles
- **Consistent testing** - same shop every time

### Purchase Testing:
- **Test coin validation** - try purchases with various coin amounts
- **Test visual feedback** - see green/red item colors
- **Test error messages** - verify "Not enough coins!" appears
- **Test confirmations** - see purchase success messages

### Development Workflow:
- **Rapid iteration** - quickly test shop changes
- **Easy debugging** - isolate shop functionality
- **Comprehensive testing** - test all purchase scenarios

## 🛍️ Complete Test Button Suite:

### Available Test Buttons:
1. **TEST SHOP** - Open shop menu instantly
2. **TEST EVENT** - Trigger random event tile
3. **SIMULATE TURN** - Apply status effects without moving
4. **ADVANCE FLOOR** - Jump to next floor
5. **ROLL DICE** - Normal gameplay dice roll

### Testing Workflow:
1. **Use "ADVANCE FLOOR"** to reach specific floors
2. **Use "TEST SHOP"** to test shop functionality
3. **Use "TEST EVENT"** to get coins/items for shop testing
4. **Use "SIMULATE TURN"** to test status effects with purchases

## 🚀 Result:

The test shop button provides:
- ✅ **Instant shop access** for testing
- ✅ **No prerequisites** - works from any game state
- ✅ **Consistent behavior** - same shop every time
- ✅ **Easy purchase testing** - test all coin scenarios
- ✅ **Development efficiency** - rapid testing workflow
- ✅ **Complete test coverage** - works with all shop features

Developers can now quickly test shop functionality, purchase protection, and visual feedback without needing to navigate to shop tiles or specific floors! 🛍️🧪"