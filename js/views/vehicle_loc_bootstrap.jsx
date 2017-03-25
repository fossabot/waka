import React from 'react'
import { browserHistory } from 'react-router'

import { iOS } from '../models/ios.js'
import { StationStore } from '../stores/stationStore.js'
import { UiStore } from '../stores/uiStore.js'

// this is hacked so it handles the current location
// and just normal people looking up a line
class VehicleLocationBootstrap extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showContent: false,
      tripInfo: {},
      lineInfo: []
    }

    this.lineMountCb = this.lineMountCb.bind(this)
    this.tripMountCb = this.tripMountCb.bind(this)
    this.triggerChange = this.triggerChange.bind(this)

    this.triggerTouchStart = this.triggerTouchStart.bind(this)
    this.triggerTouchMove = this.triggerTouchMove.bind(this)
    this.triggerTouchEnd = this.triggerTouchEnd.bind(this)
    this.triggerTouchEnd = this.triggerTouchEnd.bind(this)
  }
  componentWillMount() {
    if ('line_id' in this.props.params) {
      return this.lineMountCb(this.props)
    }
    this.tripMountCb(this.props)
  }
  componentDidMount() {
    require.ensure(['react-leaflet'], () => {
      this.VehicleLocation = require('./vehicle_loc.jsx').default
      this.setState({
        showContent: true
      })
    })

    if ('line_id' in this.props.params) {
      fetch(`/a/line/${this.props.params.line_id}`).then((response) => {
        response.json().then((data) => {
          let tripInfo = JSON.parse(JSON.stringify(this.state.tripInfo))
          tripInfo.route_long_name = data[0].route_long_name
          tripInfo.shape_id = data[0].shape_id
          tripInfo.route_type = data[0].route_type
          // tripInfo.route_type = data[]
          this.setState({
            lineInfo: data,
            tripInfo: tripInfo
          })
        })
      })
    }
    if (iOS.detect() && window.navigator.standalone === true) {
      this.refs.container.addEventListener('touchstart', this.triggerTouchStart)
      this.refs.container.addEventListener('touchmove', this.triggerTouchMove)
      this.refs.container.addEventListener('touchend', this.triggerTouchEnd)
      this.refs.container.addEventListener('touchcancel', this.triggerTouchEnd)
    }
  }
  componentWillUnmount() {
    if (iOS.detect() && window.navigator.standalone === true) {
      this.refs.container.removeEventListener('touchstart', this.triggerTouchStart)
      this.refs.container.removeEventListener('touchmove', this.triggerTouchMove)
      this.refs.container.removeEventListener('touchend', this.triggerTouchEnd)
      this.refs.container.removeEventListener('touchcancel', this.triggerTouchEnd)
    }
  }
  componentWillReceiveProps(newProps) {
    if ('line_id' in newProps.params) {
      return this.lineMountCb(newProps)
    }
    this.tripMountCb(newProps)
  }
  lineMountCb(newProps) {
    let tripInfo = {
      route_short_name: newProps.params.line_id
    } 
    if (typeof(newProps.operators) !== 'undefined') {
      tripInfo.agency_id = newProps.operators[newProps.params.line_id]
    }
    this.setState({
      tripInfo: tripInfo
    })
  }
  tripMountCb(newProps) {
    let tripNodeMatches = (item) => {
      return item.trip_id === newProps.params.trip_id
    }
    this.setState({
      tripInfo: newProps.trips.find(tripNodeMatches) || this.state.tripInfo
    })
  }
  triggerBack(){
    let newUrl = window.location.pathname.split('/')
    newUrl.splice(-1)
    UiStore.navigateSavedStations(newUrl.join('/'))
  }
  triggerChange(e) {
    let newLine = this.state.lineInfo[e.currentTarget.value]
    let tripInfo = JSON.parse(JSON.stringify(this.state.tripInfo))

    tripInfo.route_long_name = newLine.route_long_name
    tripInfo.shape_id = newLine.shape_id
    this.setState({
      tripInfo: tripInfo
    })
  }
  triggerTouchStart(event) {
    // This is a hack to detect flicks  
    this.longTouch = false
    setTimeout(() => {
      this.longTouch = true
    }, 250)

    this.touchStartPos = event.touches[0].pageX
    // this.refs.container.setAttribute('')
  }
  triggerTouchMove(event) {
    if (this.touchStartPos <= 7) {
      this.newPos = Math.max(event.touches[0].pageX - this.touchStartPos, 0)
      this.refs.container.setAttribute('style', 'transform: translate3d('+this.newPos+'px,0,0);')
    }
  }
  triggerTouchEnd(event) {
    if (this.touchStartPos <= 7) {
      this.touchStartPos = 100
      let swipedAway = false
      if (this.newPos > window.innerWidth/2 || this.longTouch === false) {
        // rejects touches that don't really move
        if (this.newPos > 3) {
          swipedAway = true
        }
      }
      if (swipedAway) {
        // navigate backwards with no animate flag
        UiStore.navigateSavedStations('/', true)
        this.refs.container.setAttribute('style', 'transform: translate3d(100vw,0,0);transition: transform 0.3s ease-out;')
      } else {
        this.refs.container.setAttribute('style', 'transform: translate3d(0px,0,0);transition: transform 0.3s ease-out;')
      }
    }
  }
  render() {
    let content = null
    let lineSelect = this.state.tripInfo.route_long_name
    if (this.state.showContent === true) {
      if ('line_id' in this.props.params) {
        let stopInfo = [-36.844229, 174.767823]
        content = (<this.VehicleLocation 
            params={this.props.params}
            lineInfo={this.state.lineInfo}
            tripInfo={this.state.tripInfo}
            stopInfo={stopInfo}
          />
        )
        if (this.state.lineInfo.length > 1) {
          lineSelect = this.state.lineInfo.map(function(line, key) {
            return <option key={key} value={key}>{line.route_long_name.replace(/ Train Station/g, '')}</option>
          })
          lineSelect = <select onChange={this.triggerChange}>{lineSelect}</select>
        }
      } else {
        let stopInfo = this.props.stopInfo
        if (typeof(stopInfo[0]) === 'undefined') {
          stopInfo = [-36.844229, 174.767823]
        }
        content = (
          <this.VehicleLocation 
            realtime={this.props.realtime}
            params={this.props.params}
            trips={this.props.trips}
            tripInfo={this.state.tripInfo}
            stopInfo={stopInfo}
          />
        )
      }
    }
    return (
      <div className='vehicle-location-container' ref="container">
        <header className='material-header'>
          <div>
            <span className="back" onTouchTap={this.triggerBack}><img src="/icons/back.svg" /></span>
            <h1 className='line-name'>
              <section className="line-pill-wrapper-header">
                <span className='line-pill' style={{backgroundColor: StationStore.getColor(this.state.tripInfo.agency_id, this.state.tripInfo.route_short_name)}}>
                  {this.state.tripInfo.route_short_name}
                </span>
              </section>
              <section className="selectWrapper">{lineSelect}</section>
            </h1>
          </div>
        </header>
        {content}
      </div>
    )
  }
}

VehicleLocationBootstrap.propTypes = {
  params: React.PropTypes.object
}

export default VehicleLocationBootstrap