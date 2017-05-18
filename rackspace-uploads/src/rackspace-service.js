const nconf = require('nconf');
const pkgcloud = require('pkgcloud');
const bluebird = require('bluebird');
const logger = require('winston');

const rackspaceContainer = nconf.get('rackspaceContainer');
const rackspaceUsername = nconf.get('rackspaceUsername');
const rackspaceApiKey = nconf.get('rackspaceApiKey');

const client = pkgcloud.storage.createClient({
  provider: 'rackspace',
  username: rackspaceUsername,
  apiKey: rackspaceApiKey,
  region: 'DFW',
  useInternal: false
});

module.exports = bluebird.promisifyAll({
  // opts requires:
  // 1. filename: the filename of the file to be uploaded
  // 2. mimeType: the mimetype of the file
  // 3. stream: the Node stream that is piped to the write stream for Rackspace
  uploadStream: function(opts, done) {
    const file = {
      container: rackspaceContainer,
      remote: opts.filename,
      contentType: opts.mimeType
    };

    const writeStream = client.upload(file);

    writeStream.on('error', function(err) {
      done(err);
    });

    writeStream.on('success', function() {
      done();
    });

    opts.stream.pipe(writeStream);
  },

  removeFile: function(filename, done) {
    if (!filename) {
      return done();
    }

    client.removeFile(rackspaceContainer, filename, function(err) {
      if (err) {
        logger.warn(err);
      }
      // ignore errors if the old file fails to be removed, we can clean up manually
      done();
    });
  }
});
