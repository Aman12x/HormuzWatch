import { useState } from 'react'
import { LiveDataProvider } from './context/LiveDataContext.jsx'
import Header from './components/Header.jsx'
import OverviewTab    from './components/tabs/OverviewTab.jsx'
import EnergyTab      from './components/tabs/EnergyTab.jsx'
import EquityTab      from './components/tabs/EquityTab.jsx'
import MethodologyTab from './components/tabs/MethodologyTab.jsx'
import NewsTab        from './components/tabs/NewsTab.jsx'
import GeoImpactTab   from './components/GeoImpactTab.jsx'

const TABS = [
  { id: 'overview',     label: 'OVERVIEW'     },
  { id: 'energy',       label: 'ENERGY MKTS'  },
  { id: 'equities',     label: 'EQUITY MKTS'  },
  { id: 'methodology',  label: 'METHODOLOGY'  },
  { id: 'news',         label: 'INTEL FEED'   },
  { id: 'geo',          label: 'GEO IMPACT'   },
]

const TAB_COMPONENTS = {
  overview    : OverviewTab,
  energy      : EnergyTab,
  equities    : EquityTab,
  methodology : MethodologyTab,
  news        : NewsTab,
  geo         : GeoImpactTab,
}

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const ActiveComponent = TAB_COMPONENTS[activeTab]

  return (
    <LiveDataProvider>
    <div className="min-h-screen bg-hw-bg flex flex-col">
      <Header />

      {/* Tab bar */}
      <div
        className="flex border-b border-hw-border bg-hw-card sticky top-0 z-10 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-5 py-3 text-xs font-mono tracking-widest whitespace-nowrap transition-colors duration-150',
              'border-b-2 focus:outline-none',
              activeTab === tab.id
                ? 'border-hw-gold text-hw-gold'
                : 'border-transparent text-hw-muted hover:text-hw-sub hover:border-hw-border',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 p-4 md:p-6 max-w-screen-2xl mx-auto w-full">
        <ActiveComponent />
      </main>

      {/* Footer */}
      <footer className="border-t border-hw-border py-3 px-6 flex items-center justify-between">
        <span className="text-hw-muted text-xs font-mono">
          HORMUZWATCH · DATA: YAHOO FINANCE · FRED (EIA) · IMF
        </span>
        <span className="text-hw-muted text-xs font-mono">
          github.com/Aman12x/hormuzwatch
        </span>
      </footer>
    </div>
    </LiveDataProvider>
  )
}
