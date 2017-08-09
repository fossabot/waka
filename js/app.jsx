import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import createHistory from 'history/createBrowserHistory'
import { iOS } from './models/ios.js'
import { UiStore } from './stores/uiStore.js'


import Index from './views/index.jsx'
import Timetable from './views/timetable.jsx'

import injectTapEventPlugin from 'react-tap-event-plugin'
injectTapEventPlugin()

class App extends React.Component {

  render() {
    return (
      <Router history={createHistory()}>
        <Index />
      </Router>
    )
  }
}
document.addEventListener('DOMContentLoaded', function(event) {
  if (process.env.NODE_ENV === 'production') {
    document.getElementById('app').className = 'production'
  }
  startApp()
})
let startApp = function() {
  ReactDOM.render(<App />, document.getElementById('app'))
}
document.ontouchmove = iOS.touchMoveFix