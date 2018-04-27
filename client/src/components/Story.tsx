import * as React from "react"
import ApiClient from "../ApiClient"
import {Item} from "../ApiClient"

interface StoryProps {
    name: string
    count: number
}

interface StoryState {
}

export default class Story extends React.Component<StoryProps, StoryState> {
    
    render() {
        return <div><p>
            {this.props.name}: {this.props.count}
        </p></div>
    }
}