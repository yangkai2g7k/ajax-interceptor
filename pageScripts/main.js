// 命名空间
import ah from "ajax-hook";
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
        let rule = ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_rules.find((element) => {
            return ajax_interceptor_qoweifjqon.matchRequest(arg[0], arg[1], element.method, element.url) && element.type === "response";
        });
        if(rule === undefined)
            return;
        xhr.responseText = rule.content;
    },
    open: (arg, xhr) => {
        let rule = ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_rules.find((element) => {
            return ajax_interceptor_qoweifjqon.matchRequest(arg[0], arg[1], element.method, element.url) && element.type === "request";
        });
        if(rule === undefined)
            return false;
        if(rule.time in ajax_interceptor_qoweifjqon.queuedRequest){
            ajax_interceptor_qoweifjqon.queuedRequest[rule.time].push(xhr);
        } else {
            ajax_interceptor_qoweifjqon.queuedRequest[rule.time] = xhr;
        }
    },
    setupTimer: () => {
        for(let time in ajax_interceptor_qoweifjqon.queuedRequest) {
            if(Date.parse(time) >= Date.now()){
                for(let xhr of ajax_interceptor_qoweifjqon.queuedRequest[time]){
                    xhr.send();
                }
                ajax_interceptor_qoweifjqon.queuedRequest[time] = [];
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
            onload:  ajax_interceptor_qoweifjqon.onresponse,
            onreadystatechange: ajax_interceptor_qoweifjqon.onresponse,
        });
        setInterval(ajax_interceptor_qoweifjqon.setupTimer, 50);
    } else {
        ah.unHookAjax();
    }
}, false);