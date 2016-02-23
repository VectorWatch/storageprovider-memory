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
}
util.inherits(StorageProviderMemory, StorageProviderAbstract);

/**
 * @inheritdoc
 */
StorageProviderMemory.prototype.storeAuthTokensAsync = function(credentialsKey, authTokens) {
    this.authTable[credentialsKey] = authTokens;
    return Promise.resolve();
};

/**
 * @inheritdoc
 */
StorageProviderMemory.prototype.getAuthTokensByCredentialsKeyAsync = function(credentialsKey) {
    return Promise.resolve(this.authTable[credentialsKey]);
};

/**
 * @inheritdoc
 */
StorageProviderMemory.prototype.getAuthTokensByChannelLabelAsync = function(channelLabel) {
    var credentialsKey = (this.userSettingsTable[channelLabel] || {}).credentialsKey;
    if (!credentialsKey) {
        return Promise.resolve();
    }
    return this.getAuthTokensByCredentialsKeyAsync(credentialsKey);
};

/**
 * @inheritdoc
 */
StorageProviderMemory.prototype.storeUserSettingsAsync = function(channelLabel, userSettings, credentialsKey) {
    if (!this.userSettingsTable[channelLabel]) {
        this.userSettingsTable[channelLabel] = {
            count: 0,
            userSettings: userSettings,
            credentialsKey: credentialsKey
        };
    }

    this.userSettingsTable[channelLabel].count++;
};

/**
 * @inheritdoc
 */
StorageProviderMemory.prototype.removeUserSettingsAsync = function(channelLabel) {
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
StorageProviderMemory.prototype.getAllUserSettingsAsync = function() {
    var results = [];
    for (var channelLabel in this.userSettingsTable) {
        results.push({
            channelLabel: channelLabel,
            userSettings: this.userSettingsTable[channelLabel],
            authTokens: this.authTable[this.userSettingsTable[channelLabel].credentialsKey]
        });
    }

    return Promise.resolve(results);
};

/**
 * @inheritdoc
 */
StorageProviderMemory.prototype.getUserSettingsAsync = function(channelLabel) {
    var userSettingsObject = this.userSettingsTable[channelLabel];

    if (!userSettingsObject) {
        return Promise.resolve();
    }

    return Promise.resolve({
        channelLabel: channelLabel,
        userSettings: this.userSettingsTable[channelLabel],
        authTokens: this.authTable[this.userSettingsTable[channelLabel].credentialsKey]
    });
};

module.exports = StorageProviderMemory;