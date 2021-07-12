import React from "react";
import ReactDOM from "react-dom";

import "css/controls.scss";

export class Switch extends React.PureComponent {

    state = { isChecked: this.props.value || false };

    constructor(props) {
        super(props);
        this.onClick = this.onClick.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (this.props.value !== prevProps.value) {
            this.setState({ isChecked: this.props.value });
        }
    }

    onClick(e) {
        let newState = !this.state.isChecked;
        this.setState({
            isChecked: newState,
        });
        this.props.onChange(newState);
    }

    render() {
        if (this.props.type && this.props.type == "big") {
            return (<div className="but BigSwitch" onClick={this.onClick}>
                <div>
                    <span>{this.props.labels[0]}</span>
                    <span>{this.props.labels[1]}</span>
                </div>
                <span className={this.state.isChecked == 0 ? "first" : "second"}>
                    {this.state.isChecked == 0 ? this.props.labels[0] : this.props.labels[1]}
                </span>
            </div>)
        } else {
            return (
                <label className="Switch" >
                    <input type="checkbox" checked={this.state.isChecked} onChange={this.onClick} />
                    <div></div>
                </label>
            )
        }
    }
}

export class Select extends React.PureComponent {
    state = { isActive: false, wasInvalid: false, selectedIndex: 0, partialInput: "" };

    constructor(props) {
        super(props);
        this.onMouseDownElement = this.onMouseDownElement.bind(this);
        this.onClickOutside = this.onClickOutside.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.onFocusInput = this.onFocusInput.bind(this);
        this.onChangeInput = this.onChangeInput.bind(this);
        this.onClickHead = this.onClickHead.bind(this);
        this.onKeyDownInput = this.onKeyDownInput.bind(this);

        this.inputRef = React.createRef();
        this.selectOptions = React.createRef();
    }

    componentDidMount() {
        document.addEventListener('mousedown', this.onClickOutside);
        window.addEventListener('resize', this.onWindowResize);
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.onClickOutside);
        window.removeEventListener('resize', this.onWindowResize);
    }

    componentDidUpdate(prevProps) {
        if (!this.props.hasSearch) return;
        if (this.props !== prevProps) {
            let newValueIndex = this.props.options.findIndex((element, index, array) => { return element.value == this.props.value });
            this.setState((state, props) => ({
                selectedIndex: newValueIndex,
                partialInput: newValueIndex == -1 ? "" : props.options[newValueIndex].label,
            }));
            return;
        }
        let options = this.selectOptions.current;
        if (options !== null) {
            let rect = options.getBoundingClientRect();
            options.style.maxHeight = Math.min((window.innerHeight - rect.top - 50), this.props.maxOptionsHeight) + "px";
            if (options.scrollHeight > options.clientHeight) {
                options.parentElement.classList.add("needInnerShadow");
            } else {
                options.parentElement.classList.remove("needInnerShadow");
            }
        }
    }

    onWindowResize(e) {
        this.setState({});
    }

    onClickOutside(e) {
        if (!(this.state.isActive)) return;
        const domNode = ReactDOM.findDOMNode(this);
        if (domNode && domNode.contains(e.target)) return;
        if (!this.props.hasSearch) {
            this.setState({
                isActive: false,
            });
        } else {
            this.onLoseFocusSelectSearch();
        }
    }

    onClickHead(e) {
        if (this.props.disabled) return;
        this.setState((state, props) => ({
            isActive: !state.isActive,
        }));
    }

    onMouseDownElement(e) {
        if (!(this.state.isActive)) return;
        let newValue = e.target.innerText;
        let newValueIndex = this.getIndexByLabel(newValue);
        if (newValueIndex == -1) return;
        this.setState({
            isActive: false,
            selectedIndex: newValueIndex,
            partialInput: newValue
        });
        this.props.onChange(this.props.options[newValueIndex].value);
    }

    onFocusInput(e) {
        if (this.props.disabled) return;
        this.setState({ isActive: true, wasInvalid: false });
    }

    onLoseFocusSelectSearch() {
        let newValueIndex = this.getIndexByLabel(this.state.partialInput);
        let newValue = newValueIndex == -1 ? "" : this.props.options[newValueIndex].label;
        let wasInvalid = (this.state.partialInput !== "") && (newValueIndex == -1);
        this.setState({
            isActive: false,
            selectedIndex: newValueIndex,
            partialInput: newValue,
            wasInvalid: wasInvalid
        });
        this.props.onChange(newValueIndex == -1 ? null : this.props.options[newValueIndex].value);
    }

    onChangeInput(e) {
        this.setState({ partialInput: e.target.value });
    }

    onKeyDownInput(e) {
        if (e.key == "Enter") {
            this.inputRef.current.blur();
            this.onLoseFocusSelectSearch();
        }
    }

    getIndexByLabel(label) {
        return this.props.options.findIndex((element, index, array) => { return element.label == label });
    }

    renderOptions() {
        if (this.state.wasInvalid) return;
        if (!this.props.showOptionsOnFocus && (this.state.partialInput == "")) return;
        return (
            <div className="select-options-wrapper">
                <div className="select-options" ref={this.selectOptions}>
                    {this.props.options.map(item => {
                        if (this.state.partialInput == "" || item.label.toLowerCase().includes(this.state.partialInput.toLowerCase())) {
                            return (<div key={item.value} onMouseDown={this.onMouseDownElement}>{item.label}</div>)
                        }
                    })}
                </div>
            </div>
        );
    }

    render() {
        if (!this.props.hasSearch) {
            return (
                <div className={`select ${this.state.isActive ? "active" : ""}`}>
                    <div className="select-head" onClick={this.onClickHead}>{this.props.options[this.state.selectedIndex].label}</div>
                    <div className="select-options">
                        {this.props.options.map((item) =>
                            <div key={item.value} onClick={this.onMouseDownElement}>{item.label}</div>
                        )}
                    </div>
                </div>
            )
        } else {
            return (
                <div className={`select-search ${this.state.isActive ? "active" : ""}`} onFocus={this.onFocusInput}>
                    <input type="text" autoComplete="off" ref={this.inputRef}
                        className={`${(this.getIndexByLabel(this.state.partialInput) !== -1) ? "valid" : ""}`}
                        value={this.state.partialInput}
                        placeholder={this.props.placeholder}
                        disabled={this.props.disabled}
                        onChange={this.onChangeInput}
                        onKeyDown={this.onKeyDownInput}
                    />
                    {this.renderOptions()}
                </div>
            )
        }
    }
}

Select.defaultProps = {
    maxOptionsHeight: 500,
    disabled: false
}

export class Slider extends React.PureComponent {
    render() {
        return (<div className="Slider" style={{ width: `${this.props.width}px` }}>
            <div style={{ marginLeft: -(this.props.width * this.props.activeNumber) }}>
                {this.props.children}
            </div>
        </div>)
    }
}

Slider.defaultProps = {
    width: 200,
    activeNumber: 0
}