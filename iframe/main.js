import React, {Component} from 'react';
import 'antd/dist/antd.css';
import {Switch, Collapse, Input, Button, Badge, Tooltip, TimePicker, Select} from 'antd';
import moment from 'moment';
const Panel = Collapse.Panel;
const Option = Select.Option;

import Replacer from './Replacer';

import './Main.less';

const buildUUID = () => {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}


export default class Main extends Component {
    constructor() {
        super();
        chrome.runtime.onMessage.addListener(({type, to, url, key}) => {
            if (type === 'ajaxInterceptor' && to === 'iframe') {
                const {interceptedRequests} = this.state;
                if (!interceptedRequests[key]) interceptedRequests[key] = [];

                const exits = interceptedRequests[key].some(obj => {
                    if (obj.url === url) {
                        obj.num++;
                        return true;
                    }
                    return false;
                });

                if (!exits) {
                    interceptedRequests[key].push({url, num: 1});
                }
                this.setState({interceptedRequests}, () => {
                    if (!exits) {
                        // 新增的拦截的url，会多展示一行url，需要重新计算高度
                        this.updateAddBtnTop_interval();
                    }
                })
            }
        });

        chrome.runtime.sendMessage(chrome.runtime.id, {
            type: 'ajaxInterceptor',
            to: 'background',
            iframeScriptLoaded: true
        });

        this.collapseWrapperHeight = -1;
    }

    state = {
        interceptedRequests: {},
    }

    componentDidMount() {
        this.updateAddBtnTop_interval();
    }


    updateAddBtnTop = () => {
        let curCollapseWrapperHeight = this.collapseWrapperRef ? this.collapseWrapperRef.offsetHeight : 0;
        if (this.collapseWrapperHeight !== curCollapseWrapperHeight) {
            this.collapseWrapperHeight = curCollapseWrapperHeight;
            clearTimeout(this.updateAddBtnTopDebounceTimeout);
            this.updateAddBtnTopDebounceTimeout = setTimeout(() => {
                this.addBtnRef.style.top = `${curCollapseWrapperHeight + 30}px`;
            }, 50);
        }
    }

    updateAddBtnTop_interval = ({timeout = 1000, interval = 50} = {}) => {
        const i = setInterval(this.updateAddBtnTop, interval);
        setTimeout(() => {
            clearInterval(i);
        }, timeout);
    }

    set = (key, value) => {
        // 发送给background.js
        chrome.runtime.sendMessage(chrome.runtime.id, {type: 'ajaxInterceptor', to: 'background', key, value});
        chrome.storage && chrome.storage.local.set({[key]: value});
    }

    forceUpdateDebouce = () => {
        clearTimeout(this.forceUpdateTimeout);
        this.forceUpdateTimeout = setTimeout(() => {
            this.forceUpdate();
        }, 1000);
    }

    handleSwitchChange = () => {
        window.setting.ajaxInterceptor_switchOn = !window.setting.ajaxInterceptor_switchOn;
        this.set('ajaxInterceptor_switchOn', window.setting.ajaxInterceptor_switchOn);

        this.forceUpdate();
    }

    handleMatchChange = (e, i) => {
        window.setting.ajaxInterceptor_rules[i].match = e.target.value;
        this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules);

        this.forceUpdateDebouce();
    }

    handleTimeChange = (time, i) => {
        window.setting.ajaxInterceptor_rules[i].time = time.format("HH:mm:ss");
        this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules);

        this.forceUpdateDebouce();
        // this.forceUpdate();
    }

    handleTypeChange = (type, i) => {
        window.setting.ajaxInterceptor_rules[i].type = type;
        this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules);
        this.forceUpdateDebouce();
    }

    handleMethodChange = (method, i) => {
        window.setting.ajaxInterceptor_rules[i].method = method;
        this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules);
        this.forceUpdateDebouce();
    }

    handleClickAdd = () => {
        window.setting.ajaxInterceptor_rules.push({
            match: '',
            key: buildUUID(),
            type: "request",
            method:"post",
            time: moment().format("HH:mm:ss")
        });
        this.forceUpdate(this.updateAddBtnTop_interval);
    }

    handleClickRemove = (e, i) => {
        e.stopPropagation();
        const {interceptedRequests} = this.state;
        const key = window.setting.ajaxInterceptor_rules[i].key;

        window.setting.ajaxInterceptor_rules = [
            ...window.setting.ajaxInterceptor_rules.slice(0, i),
            ...window.setting.ajaxInterceptor_rules.slice(i + 1),
        ];
        this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules);

        delete interceptedRequests[key];
        this.setState({interceptedRequests}, this.updateAddBtnTop_interval);
    }

    handleCollaseChange = ({timeout = 1200, interval = 50}) => {
        this.updateAddBtnTop_interval();
    }

    render() {
        console.log(window.setting.ajaxInterceptor_rules);
        return (
            <div className="main">
                <Switch
                    style={{zIndex: 10}}
                    defaultChecked={window.setting.ajaxInterceptor_switchOn}
                    onChange={this.handleSwitchChange}
                />
                <div
                    className={window.setting.ajaxInterceptor_switchOn ? 'settingBody' : 'settingBody settingBody-hidden'}>
                    {window.setting.ajaxInterceptor_rules && window.setting.ajaxInterceptor_rules.length > 0 ? (
                        <div ref={ref => this.collapseWrapperRef = ref}>
                            <Collapse
                                className={window.setting.ajaxInterceptor_switchOn ? 'collapse' : 'collapse collapse-hidden'}
                                onChange={this.handleCollaseChange}
                                // onChangeDone={this.handleCollaseChange}
                            >
                                {window.setting.ajaxInterceptor_rules.map(({type, method, match, time, overrideTxt, key}, i) => (
                                    <Panel
                                        key={key}
                                        header={
                                            <div className="panel-header" onClick={e => e.stopPropagation()}>
                                                <Select defaultValue={type}
                                                        onChange={value => this.handleTypeChange(value, i)}
                                                        style={{width: '120px', marginRight: '10px'}}
                                                >
                                                    <Option value="request">Request</Option>
                                                    <Option value="response">Response</Option>
                                                </Select>
                                                <Select defaultValue={method}
                                                        onChange={value => this.handleMethodChange(value, i)}
                                                        style={{width: '100px', marginRight: '10px'}}
                                                >
                                                    <Option value="post">Post</Option>
                                                    <Option value="get">Get</Option>
                                                    <Option value="put">Put</Option>
                                                    <Option value="delete">Delete</Option>
                                                    <Option value="patch">Patch</Option>
                                                </Select>
                                                <Input
                                                    placeholder="URL Filter"
                                                    style={{width: '230px'}}
                                                    defaultValue={match}
                                                    onChange={e => this.handleMatchChange(e, i)}
                                                />
                                                <Button
                                                    type="primary"
                                                    shape="circle"
                                                    icon="minus"
                                                    onClick={e => this.handleClickRemove(e, i)}
                                                    style={{marginLeft: '10px'}}
                                                />
                                            </div>
                                        }
                                    >
                                        {type === "response" &&
                                        <Replacer
                                            defaultValue={overrideTxt}
                                            updateAddBtnTop={this.updateAddBtnTop}
                                            index={i}
                                            set={this.set}
                                        />
                                        }
                                        {
                                            type === "request" &&
                                            <TimePicker value={moment(time, "HH:mm:ss")} onChange={value => this.handleTimeChange(value, i)} />
                                        }

                                        {this.state.interceptedRequests[key] && (
                                            <>
                                                <div className="intercepted-requests">
                                                    Intercepted Requests:
                                                </div>
                                                <div className="intercepted">
                                                    {this.state.interceptedRequests[key] && this.state.interceptedRequests[key].map(({url, num}) => (
                                                        <Tooltip placement="top" title={url} key={url}>
                                                            <Badge
                                                                count={num}
                                                                style={{
                                                                    backgroundColor: '#fff',
                                                                    color: '#999',
                                                                    boxShadow: '0 0 0 1px #d9d9d9 inset',
                                                                    marginTop: '-3px',
                                                                    marginRight: '4px'
                                                                }}
                                                            />
                                                            <span className="url">{url}</span>
                                                        </Tooltip>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </Panel>
                                ))}
                            </Collapse>
                        </div>
                    ) : <div/>}
                    <div ref={ref => this.addBtnRef = ref} className="wrapper-btn-add">
                        <Button
                            className={`btn-add ${window.setting.ajaxInterceptor_switchOn ? '' : ' btn-add-hidden'}`}
                            type="primary"
                            shape="circle"
                            icon="plus"
                            onClick={this.handleClickAdd}
                            disabled={!window.setting.ajaxInterceptor_switchOn}
                        />
                    </div>
                </div>
            </div>
        );
    }
}