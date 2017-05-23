# rackspace-uploads

A set of Express middlewares for handling file uploads.
Can work with direct to Rackspace uploads,
straight through file uploads,
and image manipulation with `gm` prior to uploading.

## Working With

### Requirements

- NodeJS 6 LTS
- Rackspace account

### Configuration

This module, like many other `@bouncingpixel` modules, relies on nconf.
The following configuration keys should be defined to use this module:

#### Required
- `rackspaceContainer`
    Required for any rackspace capability. This is the name of the container containing all the files.
- `rackspaceUsername`
    Required for any rackspace capability. This is the username to log into Rackspace.
- `rackspaceApiKey`
    Required for any rackspace capability. This is the API Key required to authenticate with Rackspace instead of using a password.

#### Optional
- `rackspaceDirectory`
    Optional config to place all uploads in a subdirectory. Useful when wanting to separate testing and production.
    While one could use `rackspaceContainer` to the same effect, some users may have a limitation that requires subdirectories.
- `rackspaceMosso`
    Required only for the direct-to-rackspace uploads. Each account has a URL with a folder that starts with "Mosso"
- `rackspaceHmacKey`
    Required only for the direct-to-rackspace uploads. The HMAC key is set on Rackspace for securing direct file uploads.

### Using Image Uploads

Image uploads are processed using `multer`, `gm` (imagemagick) and `pkgcloud` to upload to Rackspace.
The system will convert uploaded images to the desired format before uploading.
Configuring the uploader will allow imagemagick operations to occur on an image and store the resulting file.
An uploaded file can have multiple derivative files with different operations, such as different resizings.

**Note:** Multer is automatically injected into the route for you. There is no need to add multer.

Use the middleware `uploadResizedImage` to add this functionality to a route.
`uploadResizedImage` is a factory that generates a middleware using an options array. The options array
specifies which images may be uploaded, how they may be manipulated, and the resulting filenames.
For imagine manipulation, any `fn` may be a function in the package `gm` and `args` are passed to the function call.
For example:

- the image will be in the form field: `image`
- the user is uploading a file named `myfile.png`
- we would like the original, but in jpg, keeping the original file name
- we would like a 600 wide resize, then crop to 600x300, saved with a `_wall` added to the name
- we would like a 200 wide resize, then crop to 200x60, saved with a `_tile` added to the name

```js
const uploadResizedImage = require('@bouncingpixel/rackspace-uploads').middleware.uploadResizedImage;

router.post('/uploadImage', uploadResizedImage([
  {
    field: 'image',
    isRequired: true,
    maxSize: 10485760, // optional maximum file size, this is 10MB. defaults to allow all sizes
    maxFiles: 1, // the maximum number of files uploaded with this field. defaults to 1
    filename: (req, file) => {
      // return just the name portion of the filename of the file the user uploaded
      // alternatively, for random names that will not overlap:
      // look to use uuid's uuid.v4() or shortid's shortid.generate
      // do not include extension. That is added for you based on the mimetype
      return path.parse(file.filename).name;
    },

    mimetypes: ['image/png', 'image/jpeg'], // the allowed mimetypes that are not converted

    allowConversion: ['image/png', 'image/jpeg'], // could be false to stop conversions or true to convert all
                                                  // if a conversion happens, it will be to the first mimetype (png)

    out: {
      // keep the original with default name as well by doing this:
      '': [],
      'wall': [
        {fn: 'resize', args: [600]},
        {fn: 'crop', args: [600, 300]}
      ],
      'tile': [
        {fn: 'resize', args: [200]},
        {fn: 'crop', args: [200, 60]}
      ]
    }
  },
  // can have multiple fields as well, but only 1 image uploaded per field
]));
```

After the images have been uploaded, all resulting filenames are stored in `req.uploads`.
Each key in the `req.uploads` references the field names used. These point to an array of uploaded file names.
An array is used at all times, even with maxFiles is 1, to maintain consistency.
Each item in the array is an object where the keys match the keys in the `out` configuration and the values are
the file names that are the result of uploading the file for that `out` configuration.
These urls do not contain the URL portion for Rackspace. That will have to be added by the controller.
The Rackspace portion is not included as some may wish to use a service such as Imgix or define the URL
in the templates. In these cases, the database would not store the full URL, only the file name.
For the above example, the file names could be retrieved by:

```js
const originalImage = req.uploads.image[0][''];
const wallImage = req.uploads.image[0].wall;
const tileImage = req.uploads.image[0].tile;
```

### Using File Uploads

File uploads are similar to the image uploads, but with a few differences.
The file upload's `filename` function should contain both the filename and the extension.
There is no file type conversion. There is no imagemagick to perform any manipulations.
The file simply is uploaded to Rackspace with the designated filename as is.

```js
const uploadFile = require('@bouncingpixel/rackspace-uploads').middleware.uploadFile;

router.post('/uploadFile', uploadFile([
  {
    field: 'file',
    isRequired: true,
    maxSize: 10485760, // optional maximum file size, this is 10MB. defaults to allow all sizes
    maxFiles: 1, // the maximum number of files uploaded with this field. defaults to 1

    filename: (req, file) => {
      // return the full tilename
      // alternatively, for random names that will not overlap:
      // look to use uuid's uuid.v4() or shortid's shortid.generate
      // then append the extesion to it (path.parse(file.filename).ext)
      return file.filename;
    },

    mimetypes: ['image/png', 'image/jpeg'] // the allowed mimetypes that are not converted

  },
  // can have multiple fields as well, but only 1 file uploaded per field
]));
```

Similar to the image upload, the file uploads will also be available on the `req.uploads` object.
As there is no multiple derivatives for each file, the `req.uploads` is an object where they keys
are the field names used and the values are an array of files uploaded for that field.

```js
const filename = req.uploads.file[0];
```

### Using Direct-to-Rackspace

Another option for file uploads is to bypass the server and upload directly to Rackspace.
This option saves the server resources, but does not permit modifying the file. In these cases,
using a service such as Imgix will allow efficient resizing and cropping per image to happen.
In the case where many users may be uploading images at any time, this may be the optimal option.

1. The Rackspace container must be configured with CORS enabled and an HMAC key.
   A provided tool will help enable these settings and generate a secure, random HMAC key.
   The tool with ask which domains will be allowed access to upload from.
   The key should then be added to the configuration.

2. The page that shows the upload will need to use the middleware `uploadDirectVarFactory` to
   generate the settings for the form. The Dust template for the form must set all the necessary
   form fields with the provided settings. The middleware accepts two parameters:
   - `redirectTo`: the path portion of the URL to redirect to after the upload is complete
   - `fileNameFactory(req)`: a function to determine the filename-prefix and path to store in Rackspace.
     The exact filename may not be known and is not sent to the `returnTo`. To get around this, one may use
     a hidden iframe to submit the form, use JS to listen to onLoad events in the iframe, and when the iframe
     navigates to the `returnTo` page, check for an error. If no error occurred, then the full filename is:
     the result of the `fileNameFactory(req)` + the filename in the file-input field (fetchable with JS).

## Troubleshooting

_req.body is empty/null/undefined_
Be sure to set the `enctype` in the HTML form to `multipart/form-data`.

_My CSRF check fails before the route handler_
Since Multer is automatically added, the CSRF check cannot be done before Multer runs.
Exclude your CSRF check from these routes and a CSRF check will be injected after Multer.

_Getting a CSRF Token error on uploads_
All uploader routes are currently adding CSRF handling. At this time, there is no way to stop the CSRF.
Be sure to include a hidden field `_csrf` with the contents of `res.locals._csrf` or `{_csrf}` in Dust.
