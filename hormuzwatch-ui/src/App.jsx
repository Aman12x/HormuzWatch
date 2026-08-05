import { lazy, Suspense, useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import OverviewTab from './components/tabs/OverviewTab.jsx'

const EnergyTab = lazy(() => import('./components/tabs/EnergyTab.jsx'))
const EquityTab = lazy(() => import('./components/tabs/EquityTab.jsx'))
const MethodologyTab = lazy(() => import('./components/tabs/MethodologyTab.jsx'))
const NewsTab = lazy(() => import('./components/tabs/NewsTab.jsx'))
const GeoImpactTab = lazy(() => import('./components/GeoImpactTab.jsx'))

const TABS = [
  { id: 'overview', label: 'Overview', component: OverviewTab },
  { id: 'methodology', label: 'Method', component: MethodologyTab },
  { id: 'energy', label: 'Energy', component: EnergyTab },
  { id: 'equities', label: 'Equities', component: EquityTab },
  { id: 'geo', label: 'Geography', component: GeoImpactTab },
  { id: 'news', label: 'Timeline', component: NewsTab },
]

function initialTab() {
  const hash = window.location.hash.slice(1)
  return TABS.some(tab => tab.id === hash) ? hash : 'overview'
}

function LoadingPanel() {
  return (
    <div className="grid min-h-72 place-items-center rounded border border-line bg-surface">
      <div className="font-mono text-micro uppercase text-ink-3">Loading</div>
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
      <div className="flex min-h-screen flex-col bg-bg">
        <Header />

        <nav className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur-md" aria-label="Analysis sections">
          <div className="mx-auto flex max-w-screen-2xl gap-1 overflow-x-auto px-4 md:px-7" role="tablist">
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
                className={`-mb-px whitespace-nowrap border-b-2 px-3.5 py-3 text-body transition ${activeTab === tab.id ? 'border-reported font-medium text-ink' : 'border-transparent text-ink-3 hover:border-line-strong hover:text-ink-2'}`}
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
          className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 md:px-7 md:py-8"
        >
          <Suspense fallback={<LoadingPanel />}><ActiveComponent /></Suspense>
        </main>

        <footer className="mt-4 border-t border-line px-4 py-6 md:px-7">
          <div className="mx-auto flex max-w-screen-2xl flex-col gap-2 text-label text-ink-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Archived study &middot; all estimates capped at 18 June 2026</span>
            <a
              className="text-ink-2 underline decoration-line-strong underline-offset-4 transition hover:text-ink hover:decoration-ink-3"
              href="https://github.com/Aman12x/HormuzWatch"
              target="_blank"
              rel="noreferrer"
            >
              Source, notebooks and refit scripts
            </a>
          </div>
        </footer>
      </div>
    </>
  )
}
