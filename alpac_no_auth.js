// --- Alloha hooks removed ---

// --- Оригинальный Bootstrap IIFE on.js ---
(function () {
    'use strict';

    var FULL = false;
    var SELF_UPGRADE = false;
    var HOST = 'https://beta.l-vid.online';

    if (!window.lampa_settings) window.lampa_settings = {};
    if (!window.lampa_settings.disable_features) window.lampa_settings.disable_features = {};
    window.lampa_settings.disable_features.lgbt = true;

    function durableToken() {
        try {
            var m = document.cookie.match(/(?:^|;\s*)(?:alpac_token|lampac_token)=([^;]*)/);
            if (m && m[1]) return decodeURIComponent(m[1]);
        } catch (e) {}
        try { var v = localStorage.getItem('lampac_auth_token'); if (v) return v; } catch (e) {}
        var names = ['alpac_token', 'lampac_token'];
        for (var i = 0; i < names.length; i++) {
            try {
                var raw = localStorage.getItem(names[i]);
                if (!raw) continue;
                try { var p = JSON.parse(raw); if (typeof p === 'string' && p) return p; }
                catch (e) { if (raw) return raw; }
            } catch (e) {}
        }
        return '';
    }

    function putScript(src, onerror) {
        var s = document.createElement('script');
        s.src = src;
        if (onerror) s.onerror = onerror;
        (document.head || document.documentElement).appendChild(s);
    }

    if (!window.alcopac_upgrade) {
        window.alcopac_upgrade = function (tok) {
            if (!tok || window.alcopac_onjs_full) return;
            if (window.alcopac_upgrading === tok) return;
            window.alcopac_upgrading = tok;
            putScript(HOST + '/on/js/' + encodeURIComponent(tok), function () {
                if (window.alcopac_upgrade_fallback) window.alcopac_upgrade_fallback();
            });
        };
    }

    var LIST = [
      {"k":"online","o":0,"u":"https://beta.l-vid.online/online.js"},
      {"k":"catalog","o":1,"u":"https://beta.l-vid.online/catalog.js"},
      {"k":"account","o":0,"u":"https://beta.l-vid.online/account.js"},
      {"k":"server_widget","o":1,"u":"https://beta.l-vid.online/server_widget.js"}
    ];

    function optionalEnabled(key) {
        try {
            var v = Lampa.Storage.get('alcopac_plug_' + key, false);
            return v === true || v === 'true';
        } catch (e) { return false; }
    }

    function loadBundle() {
        var timer = setInterval(function () {
            if (typeof Lampa !== 'undefined') {
                clearInterval(timer);

                var unic_id = Lampa.Storage.get('lampac_unic_id', '');
                if (!unic_id) {
                    unic_id = Lampa.Utils.uid(8).toLowerCase();
                    Lampa.Storage.set('lampac_unic_id', unic_id);
                }

                var mtok = durableToken();
                if (mtok) {
                    try { if (Lampa.Storage.get('alpac_token', '') !== mtok) Lampa.Storage.set('alpac_token', mtok); } catch (e) {}
                    try { if (Lampa.Storage.get('lampac_token', '') !== mtok) Lampa.Storage.set('lampac_token', mtok); } catch (e) {}

                }

                window.alcopac_plugin_list = LIST;
                if (!window.alcopac_loaded_plugins) window.alcopac_loaded_plugins = {};
                var urls = [];
                for (var i = 0; i < LIST.length; i++) {
                    var p = LIST[i];
                    if (!p) continue;
                    if (typeof p === 'string') { urls.push(p); continue; }
                    if (window.alcopac_loaded_plugins[p.k]) continue;
                    if (p.o && !optionalEnabled(p.k)) continue;
                    window.alcopac_loaded_plugins[p.k] = true;
                    urls.push(p.u);
                }
                if (urls.length) Lampa.Utils.putScriptAsync(urls, function () {});
            }
        }, 200);
    }

    if (FULL) {
        if (window.alcopac_onjs_full) return;
        window.alcopac_onjs_full = true;
        window.alcopac_onjs = true;
        loadBundle();
        return;
    }

    if (window.alcopac_onjs) return;

    if (SELF_UPGRADE) {
        var tok = durableToken();
        if (tok) {
            window.alcopac_upgrade_fallback = function () {
                if (window.alcopac_onjs) return;
                window.alcopac_onjs = true;
                loadBundle();
            };
            window.alcopac_upgrade(tok);
            return;
        }
    }

    window.alcopac_onjs = true;
    loadBundle();
})();