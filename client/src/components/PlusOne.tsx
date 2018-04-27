import * as React from "react"
import ApiClient from "../ApiClient"
import {Item} from "../ApiClient"
import * as links from "../resources/links"

interface PlusOneProps {
    onPlusOne: () => void
    enabled: boolean
}

interface PlusOneState {
    buttonText: string
}

export default class PlusOne extends React.Component<PlusOneProps, PlusOneState> {

    constructor(props: PlusOneProps) {
        super(props)
        this.state = {
            buttonText: "+"
        }
    }

    render() {
        return this.props.enabled ? this.renderEnabled() : this.renderDisabled()
    }

    renderDisabled() {
        return <button className="disabled-plus-one">{this.state.buttonText}</button>
    }

    renderEnabled() {
        return <button className="enabled-plus-one" onClick={e => this.props.onPlusOne()}>{this.state.buttonText}</button>
    }
}