import { describe, it, expect } from 'vitest'

import { evaluateScoreWebzio } from '~/server/lib/mediaDowloader'

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
                neutral: { ...sampleFigure, totalResults:  0},
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
})