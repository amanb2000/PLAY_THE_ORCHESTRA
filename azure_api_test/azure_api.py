import urllib.request
# If you are using Python 3+, import urllib instead of urllib2

import json
data =  {

        "Inputs": {

                "input1":
                {
                    "ColumnNames": ["2", "4", "3", "7"],
                    "Values": [ [ "0", "0", "0", "0" ], [ "0", "0", "0", "0" ], ]
                },        },
            "GlobalParameters": {
}
    }

body = str.encode(json.dumps(data))

url = 'https://ussouthcentral.services.azureml.net/workspaces/fd5c4b62dde14c5a83e5a62cc4d30a39/services/d78460f565d14299b15e570dd5864cb6/execute?api-version=2.0&details=true'
api_key = 'WqUjD0EL3bqerPdCIMQ8y/LYgP8obojek7E74c3LIlhhikhsH4KGHhXHBagSnwb77qPcHjQhWDFmTmSL15qatQ==' # Replace this with the API key for the web service
headers = {'Content-Type':'application/json', 'Authorization':('Bearer '+ api_key)}

req = urllib.request.Request(url, body, headers)

try:
    response = urllib.request.urlopen(req)

    # If you are using Python 3+, replace urllib2 with urllib.request in the above code:
    # req = urllib.request.Request(url, body, headers)
    # response = urllib.request.urlopen(req)

    result = response.read()
    print(result)
except (urllib2.HTTPError, error):
    print("The request failed with status code: " + str(error.code))

    # Print the headers - they include the requert ID and the timestamp, which are useful for debugging the failure
    print(error.info())

    print(json.loads(error.read()))
