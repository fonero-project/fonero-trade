if [ -z "$FONEROTERM_S3_BUCKET" ]; then
    echo "Environment variable FONEROTERM_S3_BUCKET must be set. Take a look at setEnvironment.example.sh for an example."
    echo "Run: source setEnvironment.sh"
    exit 1
fi
if [ -z "$FONEROTERM_AWS_PROFILE" ]; then
    echo "Environment variable FONEROTERM_AWS_PROFILE must be set. Take a look at setEnvironment.example.sh for an example."
    echo "Run: source setEnvironment.sh"
    exit 1
fi

serverless --aws-profile $FONEROTERM_AWS_PROFILE invoke --function ticker --log --data='{ "image_url": "https://assets-cdn.github.com/images/modules/open_graph/github-mark.png", "key": "github.png"}'
