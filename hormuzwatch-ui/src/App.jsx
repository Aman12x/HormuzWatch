import { lazy, Suspense, useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import OverviewTab from './components/tabs/OverviewTab.jsx'

const EnergyTab = lazy(() => import('./components/tabs/EnergyTab.jsx'))
const EquityTab = lazy(() => import('./components/tabs/EquityTab.jsx'))
const MethodologyTab = lazy(() => import('./components/tabs/MethodologyTab.jsx'))
const NewsTab = lazy(() => import('./components/tabs/NewsTab.jsx'))
const GeoImpactTab = lazy(() => import('./components/GeoImpactTab.jsx'))

const TABS = [
  { id: 'overview', label: 'OVERVIEW', component: OverviewTab },
  { id: 'energy', label: 'ENERGY', component: EnergyTab },
  { id: 'equities', label: 'EQUITIES', component: EquityTab },
  { id: 'methodology', label: 'METHOD', component: MethodologyTab },
  { id: 'news', label: 'INTEL ARCHIVE', component: NewsTab },
  { id: 'geo', label: 'GLOBAL IMPACT', component: GeoImpactTab },
]

function initialTab() {
  const hash = window.location.hash.slice(1)
  return TABS.some(tab => tab.id === hash) ? hash : 'overview'
}

function LoadingPanel() {
  return (
    <div className="grid min-h-72 place-items-center border border-hw-border bg-hw-card/60">
      <div className="font-mono text-[10px] tracking-[0.24em] text-hw-muted">LOADING ANALYSIS</div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState(initialTab)
  const active = TABS.find(tab => tab.id === activeTab) ?? TABS[0]
  const ActiveComponent = active.component

  useEffect(() => {
    const onHashChange = () => setActiveTab(initialTab())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function selectTab(id) {
    setActiveTab(id)
    window.history.replaceState(null, '', `#${id}`)
  }

  function onTabKeyDown(event, index) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    let next = index
    if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = TABS.length - 1
    selectTab(TABS[next].id)
    document.getElementById(`tab-${TABS[next].id}`)?.focus()
  }

  return (
    <>
      <div className="min-h-screen bg-hw-bg flex flex-col">
        <Header />

        <nav className="sticky top-0 z-20 border-b border-hw-border bg-hw-bg/95 backdrop-blur" aria-label="Analysis sections">
          <div className="mx-auto flex max-w-screen-2xl overflow-x-auto px-3 md:px-6" role="tablist">
            {TABS.map((tab, index) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => selectTab(tab.id)}
                onKeyDown={event => onTabKeyDown(event, index)}
                className={`whitespace-nowrap border-b-2 px-4 py-3.5 font-mono text-[10px] tracking-[0.16em] transition md:px-5 ${activeTab === tab.id ? 'border-hw-gold text-hw-gold' : 'border-transparent text-hw-muted hover:text-hw-text'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <main
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="mx-auto w-full max-w-screen-2xl flex-1 p-3 sm:p-5 md:p-6"
        >
          <Suspense fallback={<LoadingPanel />}><ActiveComponent /></Suspense>
        </main>

        <footer className="border-t border-hw-border bg-hw-card/40 px-4 py-4">
          <div className="mx-auto flex max-w-screen-2xl flex-col gap-2 font-mono text-[10px] tracking-wide text-hw-muted sm:flex-row sm:items-center sm:justify-between">
            <span>HORMUZWATCH · ARCHIVED · DATA THROUGH JUN 18, 2026</span>
            <a className="transition hover:text-hw-gold" href="https://github.com/Aman12x/hormuzwatch" target="_blank" rel="noreferrer">SOURCE & METHODOLOGY ↗</a>
          </div>
        </footer>
      </div>
    </>
  )
}
