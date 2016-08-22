# Todo

## Clean up CLI argument parsing/running

An attempt was made to try and make the commands independent from the execution strategy, so they could be run outside of the CLI context.

Because of the need for CLI subcommands, as well as updates to the `yargs` module we're using for argument parsing, this got a little messy.

Basically we're currently just telling yargs to generate help for us, as well as map options (which we have very few of currently). We're then telling yargs to parse argv and manually calling the handlers. This is kind of hacky, and we're doing it mainly to be able to grab a promise that the handler returns and output error/success output from it, as well as gather and pass on some common information to all commands.

Subcommmands are hacked together using a different handler name (`action` vs `handler`). CommandRunner is riddled with logic addressing this.

So; future Sanity people; look into gathering shared, required info in a separate module that is called from each command. Not 100% sure the best way to gather command output and process it in a common way, however.
