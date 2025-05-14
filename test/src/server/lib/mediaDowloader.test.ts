import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- MOCKS MUST BE DEFINED BEFORE THE MODULE UNDER TEST IS IMPORTED ---
vi.mock('~/server/db/schema', () => ({
    mediaTracker: { timestamp: 'mocked_timestamp' },
    trackedStocks: [],
}));

const chain = {
    from: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    limit: vi.fn(), // We'll set the implementation per test
};

vi.mock('~/server/db', () => ({
    db: {
        select: vi.fn(() => chain),
    },
}));

import { evaluateScoreWebzio, getLastUpdate } from '~/server/lib/mediaDowloader'

describe('Media Downloader', () => {

    describe('evaluateScoreWebzio', () => {
        const sampleFigure = { totalResults: 0, requestsLeft: 100, posts: [] };
        it('should return zero when no data', async () => {
            const result = evaluateScoreWebzio({
                positive: { ...sampleFigure, totalResults: 0 },
                negative: { ...sampleFigure, totalResults: 0 },
                neutral: { ...sampleFigure, totalResults: 0 },
            })
            expect(result).toEqual(0)
        });
        it('should return 10 when all data is positive', async () => {
            const result = evaluateScoreWebzio({
                positive: { ...sampleFigure, totalResults: 100 },
                negative: { ...sampleFigure, totalResults: 0 },
                neutral: { ...sampleFigure, totalResults: 0 },
            })
            expect(result).toEqual(10)
        });
        it('should return -10 when all data is negative', async () => {
            const result = evaluateScoreWebzio({
                positive: { ...sampleFigure, totalResults: 0 },
                negative: { ...sampleFigure, totalResults: 1000 },
                neutral: { ...sampleFigure, totalResults: 0 },
            })
            expect(result).toEqual(-10)
        });
        it('should return slightly positive when positive is greater than negative', async () => {
            const result = evaluateScoreWebzio({
                positive: { ...sampleFigure, totalResults: 100 },
                negative: { ...sampleFigure, totalResults: 80 },
                neutral: { ...sampleFigure, totalResults: 0 },
            })
            expect(result).toEqual(2)
        }
        );
        it('should return slightly very negative when negative is greater than positive', async () => {
            const result = evaluateScoreWebzio({
                positive: { ...sampleFigure, totalResults: 100 },
                negative: { ...sampleFigure, totalResults: 300 },
                neutral: { ...sampleFigure, totalResults: 0 },
            })
            expect(result).toEqual(-7)
        }
        );
    })

    describe('getLastUpdate', () => {

        beforeEach(() => {
            vi.resetAllMocks();
            vi.useFakeTimers();

            chain.from.mockReturnThis();
            chain.orderBy.mockReturnThis();
            chain.limit.mockReset();
        });

        it('should return the latest timestamp from the mediaTracker table', async () => {
            chain.limit.mockResolvedValue([{ timestamp: new Date('2025-05-05T12:00:00Z') }]);

            const date = new Date(2000, 2, 2, 13, 30)
            vi.setSystemTime(date)

            const result = await getLastUpdate();

            expect(result).toEqual(new Date('2025-05-05T12:00:00Z'));
        });

        it('should return 24 hours ago if no data is found', async () => {
            chain.limit.mockResolvedValue([]);
            const date = new Date(2000, 2, 2, 13, 30);
            vi.setSystemTime(date);

            const result = await getLastUpdate();

            // expect(result).toEqual(new Date(Date.now() - 1000 * 60 * 60 * 24)); // 24 hours ago
            expect(result).toEqual(new Date(2000, 2, 1, 13, 30)); // 24 hours ago
        });

        it('should return 24 hours ago if an error occurs', async () => {
            chain.limit.mockRejectedValue(new Error('Database error'));
            const date = new Date(2000, 2, 2, 13, 30);
            vi.setSystemTime(date);

            const result = await getLastUpdate();

            expect(result).toEqual(new Date(2000, 2, 1, 13, 30)); // 24 hours ago
        });
    });

});