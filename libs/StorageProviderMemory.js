var util = require('util');
var StorageProviderAbstract = require('vectorwatch-storageprovider-abstract');
var Promise = require('bluebird');

/**
 * @constructor
 * @augments StorageProviderAbstract
 */
function StorageProviderMemory() {
    StorageProviderAbstract.call(this);

    this.authTable = {};
    this.userSettingsTable = {};
    this.appSettingsTable = {};
}
util.inherits(StorageProviderMemory, StorageProviderAbstract);

/**
 * @inheritdoc
 */
StorageProviderMemory.prototype.storeAuthTokensAsync = function (credentialsKey, authTokens) {
    this.authTable[credentialsKey] = authTokens;
    return Promise.resolve();
};

/**
 * @inheritdoc
 */
StorageProviderMemory.prototype.getAuthTokensByCredentialsKeyAsync = function (credentialsKey) {
    return Promise.resolve(this.authTable[credentialsKey]);
};

/**
 * @inheritdoc
 */
StorageProviderMemory.prototype.getAuthTokensByChannelLabelAsync = function (channelLabel) {
    var credentialsKey = (this.userSettingsTable[channelLabel] || {}).credentialsKey;
    if (!credentialsKey) {
        return Promise.resolve();
    }
    return this.getAuthTokensByCredentialsKeyAsync(credentialsKey);
};

/**
 * @inheritdoc
 */
StorageProviderMemory.prototype.storeUserSettingsAsync = function (channelLabel, userSettings, credentialsKey, isContextual) {

    if (!this.userSettingsTable[channelLabel]) {
        this.userSettingsTable[channelLabel] = {
            count: 0,
            userSettings: userSettings,
            credentialsKey: credentialsKey
        };
    } else {
        if (isContextual) {
            this.userSettingsTable[channelLabel].userSettings = userSettings;
        }
    }

    this.userSettingsTable[channelLabel].count++;
    return Promise.resolve();
};

/**
 * @inheritdoc
 */
StorageProviderMemory.prototype.removeUserSettingsAsync = function (channelLabel) {
    var userSettingsObject = this.userSettingsTable[channelLabel];
    if (userSettingsObject) {
        userSettingsObject.count--;
        if (userSettingsObject.count == 0) {
            delete this.userSettingsTable[channelLabel];
        }
    }

    return Promise.resolve();
};

/**
 * @inheritdoc
 */
StorageProviderMemory.prototype.getAllUserSettingsAsync = function () {
    var results = [];
    for (var channelLabel in this.userSettingsTable) {
        results.push({
            channelLabel: channelLabel,
            userSettings: this.userSettingsTable[channelLabel].userSettings,
            authTokens: this.authTable[this.userSettingsTable[channelLabel].credentialsKey]
        });
    }

    return Promise.resolve(results);
};

/**
 * @inheritdoc
 */
StorageProviderMemory.prototype.getUserSettingsAsync = function (channelLabel) {
    var userSettingsObject = this.userSettingsTable[channelLabel];

    if (!userSettingsObject) {
        return Promise.resolve();
    }

    return Promise.resolve({
        channelLabel: channelLabel,
        userSettings: this.userSettingsTable[channelLabel].userSettings,
        authTokens: this.authTable[this.userSettingsTable[channelLabel].credentialsKey]
    });
};

/**
 * @inheritdoc
 */
StorageProviderMemory.prototype.storeAppSettingsAsync = function (userKey, userSettings, credentialsKey, ttl) {
    if (!this.appSettingsTable[userKey]) {
        this.appSettingsTable[userKey] = {
            expiresAt: 0,
            userSettings: userSettings,
            credentialsKey: credentialsKey
        };
    }

    this.appSettingsTable[userKey].expiresAt = Date.now() + ttl * 1000;

    return Promise.resolve();
};

/**
 * @inheritdoc
 */
StorageProviderMemory.prototype.removeExpiredAppSettingsAsync = function () {
    var results = [];
    for (var userKey in this.appSettingsTable) {
        if (this.appSettingsTable[userKey].expiresAt > Date.now()) {
            continue;
        }

        results.push({
            userKey: userKey,
            userSettings: this.appSettingsTable[userKey].userSettings,
            authTokens: this.authTable[this.appSettingsTable[userKey].credentialsKey]
        });
    }

    for (var i in results) {
        delete this.appSettingsTable[results[i].userKey];
    }

    return Promise.resolve(results);
};

/**
 * @inheritdoc
 */
StorageProviderMemory.prototype.getAllAppSettingsAsync = function () {
    var results = [];
    for (var channelLabel in this.userSettingsTable) {
        if (this.appSettingsTable[userKey].expiresAt <= Date.now()) {
            continue;
        }

        results.push({
            channelLabel: channelLabel,
            userSettings: this.userSettingsTable[channelLabel].userSettings,
            authTokens: this.authTable[this.userSettingsTable[channelLabel].credentialsKey]
        });
    }

    return Promise.resolve(results);
};

/**
 * @inheritdoc
 */
StorageProviderMemory.prototype.getAppSettingsAsync = function (userKey) {
    var appSettingsObject = this.appSettingsTable[userKey];

    if (!appSettingsObject) {
        return Promise.resolve();
    }

    if (appSettingsObject.expiresAt <= Date.now()) {
        return Promise.resolve();
    }

    return Promise.resolve({
        userKey: userKey,
        userSettings: this.appSettingsTable[userKey].userSettings,
        authTokens: this.authTable[this.appSettingsTable[userKey].credentialsKey]
    });
};


module.exports = StorageProviderMemory;
