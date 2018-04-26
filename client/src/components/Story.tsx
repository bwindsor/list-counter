import * as React from "react"
import ApiClient from "../ApiClient"
import {Item} from "../ApiClient"
import * as links from "../resources/links"

interface StoryProps {
    name: string
    count: number
}

interface StoryState {
}

export default class Story extends React.Component<StoryProps, StoryState> {
    
    render() {
        return <div style={{fontSize: this.props.count}}>
            {this.props.name}: {this.props.count}
        </div>
    }
}