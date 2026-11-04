(function () {
  'use strict';

  // Автономный локальный тестовый профиль для Lampa.
  // Не меняет account_email / lampac_unic_id и не обращается к trial.php.

  if (!window.Lampa || !Lampa.SettingsApi || !Lampa.Storage) {
    if (window.console && console.warn) {
      console.warn('[Online2 Test] Lampa Settings API is not available.');
    }
    return;
  }

  if (window.__online2_test_plugin_loaded) return;
  window.__online2_test_plugin_loaded = true;

  var COMPONENT = 'online2_test_profile';
  var KEYS = [
    'online2_test_uid',
    'online2_test_email',
    'online2_test_created',
    'online2_test_active'
  ];

  function getTestProfile() {
    return {
      uid: Lampa.Storage.get('online2_test_uid', ''),
      email: Lampa.Storage.get('online2_test_email', ''),
      created: Lampa.Storage.get('online2_test_created', ''),
      active: Lampa.Storage.get('online2_test_active', false)
    };
  }

  function createTestProfile() {
    var uid = '';
    try {
      uid = Lampa.Utils.uid(8).toLowerCase();
    } catch (e) {
      uid = Math.random().toString(36).slice(2, 10).toLowerCase();
    }

    // .invalid зарезервирован для тестовых адресов и не является реальным email.
    var email = 'test-' + uid + '@example.invalid';

    Lampa.Storage.set('online2_test_uid', uid);
    Lampa.Storage.set('online2_test_email', email);
    Lampa.Storage.set('online2_test_created', new Date().toISOString());
    Lampa.Storage.set('online2_test_active', true);

    Lampa.Noty.show('Создан локальный тестовый профиль: ' + uid);
  }

  function clearTestProfile() {
    KEYS.forEach(function (key) {
      Lampa.Storage.set(key, '');
    });
    Lampa.Noty.show('Локальный тестовый профиль очищен');
  }

  Lampa.SettingsApi.addComponent({
    component: COMPONENT,
    name: 'Online2 — тестовый профиль',
    icon: '<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="30" height="30" rx="7" fill="none" stroke="white" stroke-width="2"/><path d="M11 18h14M18 11v14" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>'
  });

  Lampa.SettingsApi.addParam({
    component: COMPONENT,
    param: {
      name: 'online2_test_info',
      type: 'title',
      default: true
    },
    field: {
      name: 'Локальный тестовый профиль. Не влияет на реальную учётную запись и не активирует подписку.'
    }
  });

  Lampa.SettingsApi.addParam({
    component: COMPONENT,
    param: {
      name: 'online2_test_create',
      type: 'button',
      default: ''
    },
    field: {
      name: 'Создать / обновить тестовый профиль',
      description: 'Генерирует новый локальный UID и тестовый email'
    },
    onChange: createTestProfile
  });

  Lampa.SettingsApi.addParam({
    component: COMPONENT,
    param: {
      name: 'online2_test_clear',
      type: 'button',
      default: ''
    },
    field: {
      name: 'Очистить тестовый профиль',
      description: 'Удаляет только данные этого тестового плагина'
    },
    onChange: clearTestProfile
  });

  Lampa.SettingsApi.addParam({
    component: COMPONENT,
    param: {
      name: 'online2_test_status',
      type: 'title',
      default: true
    },
    field: { name: 'Тестовый профиль ещё не создан.' },
    onRender: function (item) {
      var profile = getTestProfile();
      var text = profile.active
        ? 'Создан: ' + profile.uid + ' · ' + profile.email
        : 'Тестовый профиль ещё не создан.';
      item.find('.settings-param__name,.settings-param__label,.settings-param-title__text').text(text);
    }
  });

  if (window.console && console.log) {
    console.log('[Online2 Test] Loaded. Open Settings → Online2 — тестовый профиль.');
  }
})();
