import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export function useProfitability(pigId) {
    // 1. Get Pig Current Weight
    const pig = useLiveQuery(() => db.pigs.get(pigId), [pigId]);

    // 2. Get Feed Usage for this pig
    const feedUsage = useLiveQuery(
        () => db.feed_usage.where('pig_id').equals(pigId || '').toArray()
        , [pigId]
    );

    // 3. Get all Feed Inventory (to know costs)
    const feedInventory = useLiveQuery(
        () => db.feed_inventory.toArray()
    );

    if (!pig || !feedUsage || !feedInventory) {
        return { 
            isLoading: true, 
            marketValue: 0, 
            totalCost: 0, 
            netProfit: 0, 
            roi: 0 
        };
    }

    // Constants (In real app, these could be configurable settings)
    const MARKET_PRICE_PER_KG = 9500; // COP per Kg roughly
    const FIXED_COSTS = 50000; // Vaccines, water, labor per pig roughly

    // Calculate Feed Cost
    let feedCost = 0;
    feedUsage.forEach(usage => {
        const feedItem = feedInventory.find(f => f.id === usage.feed_id);
        if (feedItem) {
            feedCost += (usage.amount_kg * feedItem.cost_per_kg);
        }
    });

    const totalCost = feedCost + FIXED_COSTS;
    const marketValue = pig.peso * MARKET_PRICE_PER_KG;
    const netProfit = marketValue - totalCost;
    const roi = totalCost > 0 ? ((netProfit / totalCost) * 100) : 0;

    return {
        isLoading: false,
        marketValue,
        totalCost,
        feedCost,
        fixedCosts: FIXED_COSTS,
        netProfit,
        roi: roi.toFixed(1),
        isProfitable: netProfit > 0 && roi > 15
    };
}
