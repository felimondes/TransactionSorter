import React from 'react'

type Props = React.PropsWithChildren<{}>
type State = { hasError: boolean; error?: Error | null }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: any) {
    // you could also log to external service here
    // console.error('Uncaught error in React tree:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{position:'fixed',left:10,top:10,right:10,bottom:10,background:'rgba(0,0,0,0.85)',color:'#fff',padding:20,zIndex:2000,overflow:'auto'}}>
          <h2 style={{marginTop:0}}>Unexpected error</h2>
          <pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.error && this.state.error.stack ? this.state.error.stack : this.state.error)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
