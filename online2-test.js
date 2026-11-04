(function () {
  'use strict';

  // Автономный локальный тестовый профиль.
  // Не меняет account_email / lampac_unic_id и не вызывает trial.php.

  var COMPONENT = 'online2_test_profile';
  var attempts = 0;

  function init() {
    if (!window.Lampa || !window.Lampa.SettingsApi || !window.Lampa.Storage) {
      attempts++;
      if (attempts < 40 && window.setTimeout) {
        window.setTimeout(init, 250);
      } else if (window.console && console.error) {
        console.error('[Online2 Test] Lampa API не появилась. Проверь адрес и момент загрузки плагина.');
      }
      return;
    }

    if (window.__online2_test_plugin_loaded) return;
    window.__online2_test_plugin_loaded = true;

    var L = window.Lampa;

    function profile() {
      return {
        uid: L.Storage.get('online2_test_uid', ''),
        email: L.Storage.get('online2_test_email', ''),
        created: L.Storage.get('online2_test_created', ''),
        active: L.Storage.get('online2_test_active', false)
      };
    }

    function createProfile() {
      var uid;
      try {
        uid = L.Utils.uid(8).toLowerCase();
      } catch (e) {
        uid = Math.random().toString(36).slice(2, 10).toLowerCase();
      }

      var email = 'test-' + uid + '@example.invalid';
      L.Storage.set('online2_test_uid', uid);
      L.Storage.set('online2_test_email', email);
      L.Storage.set('online2_test_created', new Date().toISOString());
      L.Storage.set('online2_test_active', true);

      if (L.Noty && L.Noty.show) L.Noty.show('Тестовый профиль создан: ' + uid);
    }

    function clearProfile() {
      L.Storage.set('online2_test_uid', '');
      L.Storage.set('online2_test_email', '');
      L.Storage.set('online2_test_created', '');
      L.Storage.set('online2_test_active', false);
      if (L.Noty && L.Noty.show) L.Noty.show('Тестовый профиль очищен');
    }

    L.SettingsApi.addComponent({
      component: COMPONENT,
      name: 'Online2 — тестовый профиль',
      icon: '<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="30" height="30" rx="7" fill="none" stroke="white" stroke-width="2"/><path d="M11 18h14M18 11v14" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>'
    });

    L.SettingsApi.addParam({
      component: COMPONENT,
      param: { name: 'online2_test_info', type: 'title', default: true },
      field: { name: 'Локальный тест. Не меняет настоящую учётную запись и не активирует подписку.' }
    });

    L.SettingsApi.addParam({
      component: COMPONENT,
      param: { name: 'online2_test_create', type: 'button', default: '' },
      field: {
        name: 'Создать / обновить тестовый профиль',
        description: 'Создаёт новый локальный UID и тестовый email'
      },
      onChange: createProfile
    });

    L.SettingsApi.addParam({
      component: COMPONENT,
      param: { name: 'online2_test_clear', type: 'button', default: '' },
      field: { name: 'Очистить тестовый профиль' },
      onChange: clearProfile
    });

    L.SettingsApi.addParam({
      component: COMPONENT,
      param: { name: 'online2_test_show', type: 'button', default: '' },
      field: { name: 'Показать текущий тестовый профиль', description: 'Выводит UID и тестовый email' },
      onChange: function () {
        var p = profile();
        if (L.Noty && L.Noty.show) {
          L.Noty.show(p.active ? ('UID: ' + p.uid + ' | ' + p.email) : 'Тестовый профиль не создан');
        }
      }
    });

    if (window.console && console.log) {
      console.log('[Online2 Test] Плагин загружен. Раздел: ' + COMPONENT);
    }
  }

  init();
})();
