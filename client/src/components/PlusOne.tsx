import * as React from "react"
import ApiClient from "../ApiClient"
import {Item} from "../ApiClient"

interface PlusOneProps {
    onPlusOne: () => Promise<void>
}

interface PlusOneState {
    buttonText: () => string
    enabled: boolean
}

export default class PlusOne extends React.Component<PlusOneProps, PlusOneState> {

    constructor(props: PlusOneProps) {
        super(props)
        this.state = {
            buttonText: () => this.state.enabled ? "+1" : "...",
            enabled: true
        }
    }

    render() {
        return this.state.enabled ? this.renderEnabled() : this.renderDisabled()
    }

    renderDisabled() {
        return <button className="btn btn-warning plus-one" onClick={e => console.log("disabled")}>{this.state.buttonText()}</button>
    }

    renderEnabled() {
        return <button className="btn btn-primary plus-one" onClick={e => this.onClick()}>{this.state.buttonText()}</button>
    }

    onClick() {
        console.log('dis')
        this.setState({enabled: false})
        this.props.onPlusOne()
            .then(() => {
                console.log('en')
                this.setState({enabled: true})
            })
            .catch((err) => {
                console.error(err)
                this.setState({enabled: true})
            })
    }
}