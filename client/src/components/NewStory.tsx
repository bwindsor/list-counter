import * as React from "react"
import ApiClient from "../ApiClient"
import {Item} from "../ApiClient"
import * as links from "../resources/links"

interface NewStoryProps {
    onAdd: (storyName: string) => void
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
        return <div>
            
            <button onClick={e => this.setState({isExpanded: false})}>Cancel</button>
        </div>
    }
}