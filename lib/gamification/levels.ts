import { LevelDefinition } from '@/lib/types'

export const LEVELS: LevelDefinition[] = [
  { level: 1,  title: 'Novice',             xpRequired: 0,    xpToNext: 100   },
  { level: 2,  title: 'Curious Reader',     xpRequired: 100,  xpToNext: 150   },
  { level: 3,  title: 'News Follower',      xpRequired: 250,  xpToNext: 200   },
  { level: 4,  title: 'Market Watcher',     xpRequired: 450,  xpToNext: 300   },
  { level: 5,  title: 'Finance Apprentice', xpRequired: 750,  xpToNext: 400   },
  { level: 6,  title: 'Policy Tracker',     xpRequired: 1150, xpToNext: 500   },
  { level: 7,  title: 'Analyst',            xpRequired: 1650, xpToNext: 650   },
  { level: 8,  title: 'Market Analyst',     xpRequired: 2300, xpToNext: 800   },
  { level: 9,  title: 'Macro Thinker',      xpRequired: 3100, xpToNext: 1000  },
  { level: 10, title: 'Strategist',         xpRequired: 4100, xpToNext: 1200  },
  { level: 11, title: 'Senior Analyst',     xpRequired: 5300, xpToNext: 1500  },
  { level: 12, title: 'Portfolio Manager',  xpRequired: 6800, xpToNext: 1800  },
  { level: 13, title: 'Macro Economist',    xpRequired: 8600, xpToNext: 2200  },
  { level: 14, title: 'Chief Analyst',      xpRequired: 10800, xpToNext: 2600 },
  { level: 15, title: 'Market Sage',        xpRequired: 13400, xpToNext: 3000 },
  { level: 16, title: 'Geopolitician',      xpRequired: 16400, xpToNext: 3500 },
  { level: 17, title: 'Global Strategist',  xpRequired: 19900, xpToNext: 4000 },
  { level: 18, title: 'Financial Oracle',   xpRequired: 23900, xpToNext: 5000 },
  { level: 19, title: 'Grand Analyst',      xpRequired: 28900, xpToNext: 6000 },
  { level: 20, title: 'Oracle',             xpRequired: 34900, xpToNext: Infinity },
]

export function getLevelFromXP(xp: number): LevelDefinition {
  let current = LEVELS[0]
  for (const level of LEVELS) {
    if (xp >= level.xpRequired) {
      current = level
    } else {
      break
    }
  }
  return current
}

export function getXPProgress(xp: number): { current: LevelDefinition; progressPct: number } {
  const current = getLevelFromXP(xp)
  const xpIntoLevel = xp - current.xpRequired
  const progressPct = current.xpToNext === Infinity
    ? 100
    : Math.min(100, Math.round((xpIntoLevel / current.xpToNext) * 100))
  return { current, progressPct }
}
