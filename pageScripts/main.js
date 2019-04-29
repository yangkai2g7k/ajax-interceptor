// 命名空间
import ah from "ajax-hook";
import moment from "moment";

let ajax_interceptor_qoweifjqon = {

    settings: {
        ajaxInterceptor_switchOn: false,
        ajaxInterceptor_rules: [],
    },
    queuedRequest: {},
    matchRequest: (sourceMethod, sourceUrl, targetMethod, targetUrl) => {
        if (!sourceMethod || !sourceUrl || !targetMethod || !targetUrl) {
            return false;
        }
        if (sourceMethod.toUpperCase() !== targetMethod.toUpperCase()) {
            return false;
        }
        return sourceUrl.indexOf(targetUrl) > -1;
    },
    onresponse: (xhr) => {
        console.log("intercept response method:%s,url:%s",xhr.method, xhr.url);
        let rule = ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_rules.find((element) => {
            return ajax_interceptor_qoweifjqon.matchRequest(xhr.method, xhr.url, element.method, element.match) && element.type === "response";
        });
        if(rule === undefined)
            return;
        window.dispatchEvent(new CustomEvent("pageScript", {
            detail: {
                url: rule.match,
                key: rule.key,
            }
        }));
        console.log("intercept response method:%s,url:%s",xhr.method, xhr.url);
        xhr.responseText = rule.overrideTxt;
    },
    open: (arg, xhr) => {
        xhr.method = arg[0];
        xhr.url = arg[1];
        return false;
    },
    send: (arg, xhr) => {
        // console.log("intercept request method:%s,url:%s",xhr.method, xhr.url);
        let rule = ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_rules.find((element) => {
            return ajax_interceptor_qoweifjqon.matchRequest(xhr.method, xhr.url, element.method, element.match) && element.type === "request";
        });
        if(rule === undefined)
            return false;
        console.log("intercept request method:%s,url:%s",xhr.method, xhr.url);
        window.dispatchEvent(new CustomEvent("pageScript", {
            detail: {
                url: rule.match,
                key: rule.key,
            }
        }));
        if(rule.time in ajax_interceptor_qoweifjqon.queuedRequest){
            ajax_interceptor_qoweifjqon.queuedRequest[rule.time].push(xhr);
        } else {
            ajax_interceptor_qoweifjqon.queuedRequest[rule.time] = [xhr];
        }
        return true;
    },
    setupTimer: () => {
        for(let time in ajax_interceptor_qoweifjqon.queuedRequest) {
            if(moment().isSameOrAfter(moment(time, "HH:mm:ss"))){
                console.log("after time", time);
                ajax_interceptor_qoweifjqon.queuedRequest[time].reverse().forEach(xhr => {
                    console.log("send request", xhr);
                    xhr.send();
                });
                delete ajax_interceptor_qoweifjqon.queuedRequest[time];
            }
        }
    }
};


window.addEventListener("message", function (event) {
    const data = event.data;
    if (data.type === 'ajaxInterceptor' && data.to === 'pageScript') {
        ajax_interceptor_qoweifjqon.settings[data.key] = data.value;
    }

    if (ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_switchOn) {
        ah.hookAjax({
            open: ajax_interceptor_qoweifjqon.open,
            send: ajax_interceptor_qoweifjqon.send,
            onload:  ajax_interceptor_qoweifjqon.onresponse,
            onreadystatechange: ajax_interceptor_qoweifjqon.onresponse,
        });
        setInterval(ajax_interceptor_qoweifjqon.setupTimer, 50);
    } else {
        ah.unHookAjax();
    }
}, false);