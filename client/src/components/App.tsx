import * as React from "react"
import ApiClient from "../ApiClient"
import {Item} from "../ApiClient"
import * as links from "../resources/links"

interface AppState {
    apiClient: ApiClient
    items: Item[]
}

export default class App extends React.Component<undefined, AppState> {
    constructor(props: any) {
        super(props)
        this.state = {
            apiClient: new ApiClient(links.API_BASE),
            items: []
        }
    }

    componentDidMount() {
        this.state.apiClient.getAllItems().then(items => {
            this.setState({items: items})
        })
    }

    render() {
        return <div>
            {this.state.items.map((item, i) => <div key={`item-${i}`}>{item.name}</div>)}
        </div>
    }
}