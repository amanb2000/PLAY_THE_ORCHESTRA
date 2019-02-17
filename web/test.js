var http = require('http')
var api_key = 'WqUjD0EL3bqerPdCIMQ8y/LYgP8obojek7E74c3LIlhhikhsH4KGHhXHBagSnwb77qPcHjQhWDFmTmSL15qatQ=='


var options = {
  hostname: 'https://ussouthcentral.services.azureml.net/workspaces/fd5c4b62dde14c5a83e5a62cc4d30a39/services/d78460f565d14299b15e570dd5864cb6/execute?api-version=2.0&details=true',
  path: '/get',
  headers: {
    Content-type: 'application/json',
    Authorization: 'Bearer ' + api_key
  }
}

http.get(options, (response) => {

  var res = '';
  response.on('data', function(chunk) {
    result += chunk;
  });

  response.on('end', function() {
    console.log(result);
  })
});
