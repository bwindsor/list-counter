import * as React from "react"
import ApiClient from "../ApiClient"
import {Item} from "../ApiClient"
import * as links from "../resources/links"

interface NewStoryProps {
    onAdd: (storyName: string) => void
    nameValidator: (storyName: string) => boolean
}

interface NewStoryState {
    isExpanded: boolean
    name: string
}

export default class Story extends React.Component<NewStoryProps, NewStoryState> {
    constructor(props: NewStoryProps) {
        super(props)
        this.state = {
            isExpanded: false,
            name: ""
        }
    }

    render() {
        if (this.state.isExpanded) {
            return this.renderExpanded()
        } else {
            return this.renderCollapsed()
        }
    }

    renderCollapsed() {
        return <button onClick={e => this.setState({isExpanded: true})}>New story</button>
    }

    renderExpanded() {
        let isNameValid = this.props.nameValidator(this.state.name)

        return <div>
            <input
                type="text"
                onChange={e => this.setState({name: e.target.value})}
                value={this.state.name}
                className={isNameValid ? "input-valid" : "input-invalid"}
            />
            {isNameValid && <button onClick={e => this.onOKClick()}>OK</button>}
            <button onClick={e => this.setState({isExpanded: false})}>Cancel</button>
        </div>
    }

    onOKClick() {
        this.props.onAdd(this.state.name)
        this.setState({isExpanded: false, name: ""})
    }
}