import * as React from "react"
import ApiClient from "../ApiClient"
import { Item } from "../ApiClient"

interface NewStoryProps {
    rowClass: string
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
        return <div className={this.props.rowClass}>
            <button className="btn btn-primary btn-block" onClick={e => this.setState({ isExpanded: true })}>New story</button>
        </div>
    }

    renderExpanded() {
        let isNameValid = this.props.nameValidator(this.state.name)

        return <div className={this.props.rowClass}>
            <div className="col">
                <div className="row">
                    <div className="col-12 col-sm mr-auto p-1">
                        <input
                            type="text"
                            onChange={e => this.setState({ name: e.target.value })}
                            value={this.state.name}
                            placeholder="Description of new story"
                            className={"form-control" + (isNameValid ? "" : " input-invalid")}
                        />
                    </div>
                    <div className="col-auto p-1">
                        <button
                            className={"btn btn-primary" + (isNameValid ? "" : " disabled")}
                            onClick={isNameValid ? e => this.onOKClick() : e => { }}>
                            OK
                        </button>
                    </div>
                    <div className="col-auto p-1">
                        <button className="btn btn-danger" onClick={e => this.setState({ isExpanded: false })}>Cancel</button>
                    </div>
                </div>
                <div className="row">
                    <small className="form-text text-muted px-1">
                        Must be 4-100 characters
                    </small>
                </div>
            </div>
        </div>
    }

    onOKClick() {
        this.props.onAdd(this.state.name.trim())
        this.setState({ isExpanded: false, name: "" })
    }
}