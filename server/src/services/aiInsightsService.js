import { config } from '../config/index.js';

export const aiInsightsService = {
  async generateFinancialInsights(personalExpenses, groupExpenses, userCurrency = '₹') {
    const allExpenses = [
      ...personalExpenses.map(e => ({ ...e, source: 'Personal' })),
      ...groupExpenses.map(e => ({ ...e, source: 'Group' }))
    ];

    if (allExpenses.length === 0) {
      return {
        healthScore: 100,
        summary: 'No expenses recorded yet. Start tracking your daily spending to receive smart AI insights!',
        topCategory: 'N/A',
        recommendations: [
          'Log your daily food and travel expenses to build a baseline budget.',
          'Create a group for your next trip or roommate bills to split expenses effortlessly.'
        ]
      };
    }

    const totalSpent = allExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    
    // Group by category
    const categoryTotals = {};
    allExpenses.forEach(e => {
      const cat = e.category || 'Others';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount || 0);
    });

    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topCatName = sortedCategories[0]?.[0] || 'Others';
    const topCatSpent = sortedCategories[0]?.[1] || 0;
    const topCatPercent = Math.round((topCatSpent / totalSpent) * 100);

    // Calculate score
    let healthScore = 85;
    if (topCatPercent > 50) healthScore -= 15;
    if (totalSpent > 50000) healthScore -= 10;
    healthScore = Math.max(40, Math.min(100, healthScore));

    const recommendations = [];
    if (topCatPercent > 40) {
      recommendations.push(`High spending detected in ${topCatName} (${topCatPercent}% of total). Consider setting a weekly budget cap.`);
    } else {
      recommendations.push(`Your spending is well-balanced across categories.`);
    }

    if (categoryTotals['Food'] && categoryTotals['Food'] > totalSpent * 0.3) {
      recommendations.push(`Dining out and food delivery account for over 30% of your expenses. Cooking at home 2 days/week could save ~${userCurrency}${Math.round(categoryTotals['Food'] * 0.2)} monthly.`);
    }

    if (categoryTotals['Entertainment'] && categoryTotals['Entertainment'] > 5000) {
      recommendations.push(`Entertainment spending is ${userCurrency}${categoryTotals['Entertainment']}. Review active streaming subscriptions.`);
    }

    recommendations.push(`Always settle up group debts promptly to maintain clear financial relationships with friends.`);

    return {
      healthScore,
      summary: `You have spent ${userCurrency}${totalSpent.toLocaleString()} across ${allExpenses.length} total transactions. Your primary spending driver is ${topCatName} (${topCatPercent}%).`,
      topCategory: topCatName,
      topCategoryPercent: topCatPercent,
      categoryBreakdown: categoryTotals,
      recommendations
    };
  }
};
