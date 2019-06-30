# Shoutout
This is a small CLI script to generate patterns made out of strings that you pass in.
I use it to make patterns of emojis to paste into slack.

## Installation
Clone the repository somewhere on your machine
```
$ git clone git@github.com:er9781/shoutout.git
```

You need node to be able to run this.

## Usage
The script will take optional parameters to configure the pattern. All options can be seen with
```
$ node shoutout.js --help
```

I personally add an alias to my `.bashrc` for `node shoutout.js`, although you could also add a `.sh` script and modify your path.

The script outputs to `stdout`, and so most often I use it in conjunction with `pbcopy` on mac.

```
$ node shoutout.js --square hugging_face smile frowning | pbcopy
```