# AI Insights Quick Reference Guide

## 🎯 7 Recommendation Types at a Glance

### 1️⃣ **Restock Recommendation** 📦
**When:** Product stock running critically low
**Shows:** Days until stockout, reorder quantity, revenue impact
**Example:** "Smart Watch: Reorder 25 units within 3 days"
**Confidence:** 70-94% (based on sales volume)
**Key Metric:** Days until stock depletion
**Action:** Place reorder immediately for critical items

---

### 2️⃣ **Sales Trend Alert** 📈
**When:** Significant week-over-week sales change detected
**Shows:** Product name, % change, last sale time, momentum
**Example:** "Wireless Headphones: 45% increase this week (2 hrs since last sale)"
**Confidence:** 60-95% (based on sales data)
**Key Metric:** Percentage change (positive = growth, negative = decline)
**Action:** Increase/decrease stock or adjust marketing

---

### 3️⃣ **Revenue Optimization** 💰
**When:** Opportunity to increase average order value
**Shows:** Current AOV, bundle suggestion, target AOV
**Example:** "Current $159 AOV → Bundle for $210 (target)"
**Confidence:** 70-90% (based on product data)
**Key Metric:** AOV increase potential (+32%)
**Action:** Create product bundles and promote together

---

### 4️⃣ **Slow-Moving Stock Alert** 🔻
**When:** Products not selling despite inventory
**Shows:** Days in inventory, 30-day sales count, stock value
**Example:** "Desk Lamp: 45 days in inventory, only 2 sales"
**Confidence:** ~91% (days-based analysis)
**Key Metric:** Days without sales / Inventory turnover
**Action:** Run promotions, bundle deals, or discontinue

---

### 5️⃣ **Sales Forecast** 🎯
**When:** Projecting monthly revenue based on trends
**Shows:** Projected monthly revenue, vs target ($12,900), trend direction
**Example:** "Projected $15,200 revenue (18% above $12,900 target)"
**Confidence:** 50-89% (based on sales volume)
**Key Metric:** Monthly revenue projection with % vs target
**Action:** Plan inventory and staffing for projected demand

---

### 6️⃣ **Peak Sales Hours** ⏰ (NEW!)
**When:** Analyzing hourly sales distribution patterns
**Shows:** Peak hours, % of daily sales, off-peak opportunity
**Example:** "Peak: 2-3 PM (38.7% of sales) → Promote 10 AM-12 PM"
**Confidence:** 60-85% (based on hourly distribution)
**Key Metric:** Peak hour percentage and off-peak opportunity window
**Action:** Run flash sales/promotions during off-peak hours

---

### 7️⃣ **Financial Overview Breakdown** 📊
**When:** Always displayed (company-wide financial health)
**Shows:** Net/Gross margins, profit, operating expenses, optimization score
**Example:** "Net margin: 18.5% | Optimization Score: 78/100"
**Confidence:** 92% (calculation-based)
**Key Metric:** Net profit margin & optimization score (0-100)
**Action:** Monitor margins, optimize costs, track efficiency

---

## 📊 Statistics Dashboard

```
┌─────────────────────────────────┐
│  OPTIMIZATION SCORE              │
│        78/100                     │  ← Overall health (0-100)
├─────────────────────────────────┤
│  PREDICTIONS MADE    ACTIONS    │
│        12              28        │  ← Sum of all arrays
└─────────────────────────────────┘
```

**Optimization Score Calculation:**
- Margin Score (target: 20% net margin)
- Revenue Score (target: $50,000)
- Product Diversity Score (target: 10+ products)
- Result: Average of 3 scores

**Predictions Made:** Total count of all 3-item predictions arrays
**Actions Taken:** Total count of all 4-item action arrays

---

## 🔍 What Each Insight Includes

### Description
One-sentence summary with specific metric
```
"Smart Watch stock is critically low. Based on recent sales velocity 
(3 sold today), you should reorder 25 units within the next 3 days."
```

### Confidence
50-95% (higher = more data = more reliable)
```
Confidence: 94% (based on 15 sales in last 7 days)
```

### Predictions (3 items)
Future-looking statements with specific numbers
```
✓ Stock will deplete in 3 days at current velocity
✓ Potential lost sales: ~21 units if not restocked
✓ Revenue impact: ~$2,100 in lost sales
```

### Actions Taken (4 items)
Concrete action items with supporting metrics
```
✓ Analyzed sales velocity: 3 sold today, 2.86 units/day average
✓ Stock level critical: Only 9 units remaining
✓ Reorder recommended: 25 units within next 3 days
```

---

## 📈 Urgency Levels & Colors

| Level | Color | Meaning | Response Time |
|-------|-------|---------|----------------|
| **HIGH** | 🔴 Red | Critical/Urgent | Within 24 hours |
| **MEDIUM** | 🟠 Orange | Important | Within 1 week |
| **LOW** | 🟢 Green | Positive/Monitor | Ongoing |

---

## 💡 How to Use Each Insight

### 📦 Restock Recommendation
1. Check days until stockout (< 7 days = urgent)
2. Note exact reorder quantity
3. Place order immediately
4. Monitor stock levels closely

### 📈 Sales Trend Alert
1. Check if growth (📈) or decline (📉)
2. Review product performance
3. Adjust inventory or marketing accordingly
4. Monitor next week for continuation

### 💰 Revenue Optimization
1. Note suggested bundle products
2. Check target AOV increase
3. Create product bundle deal
4. Promote bundle in marketing
5. Track if AOV increases

### 🔻 Slow-Moving Stock Alert
1. Note days in inventory
2. Decide: Promote, Bundle, or Discontinue
3. If promoting: set discount/offer
4. If bundling: pair with fast-moving item
5. Track improvement in sales velocity

### 🎯 Sales Forecast
1. Note projected monthly revenue
2. Compare to $12,900 target
3. If below target: increase marketing
4. If above target: ensure inventory supply
5. Plan staffing and resources accordingly

### ⏰ Peak Sales Hours
1. Note peak hour(s)
2. Identify off-peak window
3. Plan flash promotions for off-peak
4. Test promotions and measure lift
5. Optimize promotional timing

### 📊 Financial Breakdown
1. Monitor net profit margin (target: 20%+)
2. Check gross margin (target: 50%+)
3. Review operating expenses (target: <30%)
4. Track optimization score (target: 70+)
5. Identify areas for cost reduction

---

## 📊 Example Data Ranges

### Restock Recommendations
- **Confidence:** 70-94%
- **Days Until Stockout:** 1-14 days
- **Recommended Qty:** 7-100 units (2-week supply)
- **Revenue Impact:** $100-$10,000

### Sales Trend Alerts
- **Confidence:** 60-95%
- **% Change:** -75% to +200%
- **Last Sale:** < 1 hour to several days ago
- **Weekly Revenue:** $10-$5,000

### Revenue Optimization
- **Confidence:** 70-90%
- **Current AOV:** $20-$500
- **Target AOV:** +20% to +50% increase
- **Bundle Potential:** $50-$100+ additional per sale

### Slow-Moving Stock
- **Confidence:** ~91%
- **Days in Inventory:** 30-365+ days
- **30-Day Sales:** 0-2 units
- **Stock Value:** $100-$10,000

### Sales Forecast
- **Confidence:** 50-89%
- **Monthly Projection:** $3,000-$50,000+
- **vs Target:** -50% to +100%
- **Trend Multiplier:** 0.5x to 2.5x

### Peak Sales Hours
- **Confidence:** 60-85%
- **Peak % of Sales:** 20%-50%
- **Peak Hour:** Any hour 8 AM - 8 PM
- **Sales Distribution:** 5-20 different hours

---

## 🎯 Priority Matrix

```
URGENCY vs IMPORTANCE:

URGENT + IMPORTANT (DO NOW):
┌──────────────────────────────┐
│ High Restock (< 7 days)      │
│ Major Revenue Loss Alert     │
│ Critical Slow-Moving (90d+)  │
└──────────────────────────────┘
👉 Action: Immediate response needed

IMPORTANT but NOT URGENT (DO THIS WEEK):
┌──────────────────────────────┐
│ Medium Restock (7-14 days)   │
│ Strong Sales Trends          │
│ Bundle Recommendations       │
│ Peak Hours Strategy          │
└──────────────────────────────┘
👉 Action: Schedule and execute

NOT URGENT (MONITOR):
┌──────────────────────────────┐
│ Sales Forecasts              │
│ Positive Trends              │
│ Financial Metrics            │
│ Optimization Scores          │
└──────────────────────────────┘
👉 Action: Review regularly
```

---

## 📋 Daily AI Insights Checklist

### Morning Review (5 minutes)
- [ ] Check Optimization Score (trending up/down?)
- [ ] Review any HIGH priority alerts
- [ ] Note critical restocks needed
- [ ] Check if any sales exceeded forecasts

### Weekly Review (15 minutes)
- [ ] Review all 7 insight types
- [ ] Prioritize top 3 action items
- [ ] Check on previous week's actions (did they work?)
- [ ] Plan marketing based on trends/forecasts
- [ ] Prepare any reorder purchases

### Monthly Review (30 minutes)
- [ ] Compare this month's forecast vs actual revenue
- [ ] Review product performance changes
- [ ] Check if optimization score improved
- [ ] Evaluate bundle effectiveness
- [ ] Plan next month's inventory strategy

---

## 🔄 Data Refresh Frequency

**Automatic Updates:**
- Every time you view the AI Insights page
- When you reconnect to Shopify
- Every hour (if auto-sync enabled)

**How to Force Refresh:**
1. Go to Integrations page
2. Disconnect Shopify
3. Reconnect Shopify
4. Return to AI Insights

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| No insights showing | Ensure Shopify connected + products/orders loaded |
| Low confidence scores | Need more sales data (minimum 5 orders) |
| Numbers seem off | Verify Shopify data is correct in Admin |
| Missing Peak Hours | Need sales throughout multiple hours |
| Forecast unrealistic | Check if sales data spans at least 2 weeks |

---

## 📞 Quick Reference

**What if you see:**
- 📦 "3 days" → Reorder within 24 hours
- 📈 "45% increase" → Increase stock by 20-30%
- 💰 "+$51 AOV" → Create and promote bundle
- 🔻 "45 days" → Run 20-30% promotion
- 🎯 "18% above target" → Ensure sufficient stock
- ⏰ "2-3 PM peak" → Run flash sale 10-12 PM
- 📊 "18.5% margin" → Good, but aim for 20%+

---

## 🎓 Learning Path

**1. Understand the Metrics** (5 minutes)
- Read descriptions of each insight type
- Note the example outputs

**2. Connect Your Store** (5 minutes)
- Sync Shopify products and orders
- Wait for data to populate

**3. Review Your Insights** (10 minutes)
- Read cards and details
- Understand what data supports each insight

**4. Take First Action** (varies)
- Start with HIGH priority items
- Implement the recommendations

**5. Track Results** (ongoing)
- Monitor if recommendations worked
- Use metrics to improve next time

---

## ✅ Success Indicators

You're using AI Insights effectively when:
- ✅ You never run out of fast-moving products
- ✅ You identify and reduce slow-moving inventory
- ✅ Your average order value increases
- ✅ Your net profit margin improves
- ✅ You optimize promotional timing
- ✅ Your optimization score increases monthly
- ✅ Revenue trends match forecasts

---

## 🚀 Quick Start

1. **Connect Shopify** → Go to Integrations
2. **Wait for Sync** → Products and orders load (1-5 minutes)
3. **View AI Insights** → See all 7 recommendation types
4. **Read Summary Cards** → Understand key recommendations
5. **Click "Details"** → See predictions and actions
6. **Take Action** → Implement top 3 recommendations
7. **Review Weekly** → Track progress and improvements

---

## 📱 Mobile-Friendly Tips

- Insights visible on mobile
- Tap card to expand details
- Swipe to see all recommendations
- Check stats at the top regularly
- Take screenshots of urgent items

---

## 🎯 One-Page Reminder

**7 Insights → 7 Benefits:**

| # | Insight | Benefit |
|---|---------|---------|
| 1 | 📦 Restock | Never stock out |
| 2 | 📈 Trends | Find growing products |
| 3 | 💰 Revenue | Increase order value |
| 4 | 🔻 Slow-Moving | Clear inventory |
| 5 | 🎯 Forecast | Plan ahead |
| 6 | ⏰ Peak Hours | Optimize timing |
| 7 | 📊 Financial | Monitor health |

---

**Status:** Ready to use!
**Last Updated:** [Current Date]
**Questions?** Check the detailed guides or reconnect Shopify

