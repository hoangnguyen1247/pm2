"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _default = {
  "script": {
    "type": "string",
    "require": true,
    "alias": "exec",
    "docDescription": "Path of the script to launch, required field"
  },
  "name": {
    "type": "string",
    "docDefault": "Script filename without the extension (app for app.js)",
    "docDescription": "Process name in the process list"
  },
  "name_prefix": {
    "type": "string"
  },
  "filter_env": {
    "type": ["boolean", "array", "string"],
    "docDefault": false,
    "docDescription": "Enable filtering global environments"
  },
  "namespace": {
    "type": "string",
    "docDefault": "default",
    "docDescription": "Process namespace"
  },
  "install_url": {
    "type": "string"
  },
  "cwd": {
    "type": "string",
    "docDefault": "CWD of the current environment (from your shell)",
    "docDescription": "Current working directory to start the process with"
  },
  "args": {
    "type": ["array", "string"],
    "docDescription": "Arguments to pass to the script"
  },
  "exec_interpreter": {
    "type": "string",
    "alias": "interpreter",
    "docDefault": "node",
    "docDescription": "Interpreter absolute path"
  },
  "node_args": {
    "type": ["array", "string"],
    "alias": ["interpreterArgs", "interpreter_args"],
    "docDescription": "Arguments to pass to the interpreter"
  },
  "out_file": {
    "type": "string",
    "alias": ["out", "output", "out_log"],
    "docDefault": "~/.pm2/logs/<app_name>-out.log",
    "docDescription": "File path for stdout (each line is appended to this file)"
  },
  "error_file": {
    "type": "string",
    "alias": ["error", "err", "err_file", "err_log"],
    "docDefault": "~/.pm2/logs/<app_name>-error.err",
    "docDescription": "File path for stderr (each line is appended to this file)"
  },
  "log_file": {
    "type": ["boolean", "string"],
    "alias": "log",
    "docDefault": "/dev/null",
    "docDescription": "File path for combined stdout and stderr (each line is appended to this file)"
  },
  "disable_logs": {
    "type": "boolean",
    "docDefault": false,
    "docDescription": "Disable all logs storage"
  },
  "log_type": {
    "type": "string",
    "docDescription": "Define a specific log output type, possible value: json"
  },
  "log_date_format": {
    "type": "string",
    "docDescription": "Format for log timestamps in day.js format (eg YYYY-MM-DD HH:mm Z)"
  },
  "time": {
    "type": "boolean"
  },
  "env": {
    "type": ["object", "string"],
    "docDescription": "Specify environment variables to be injected"
  },
  "^env_\\S*$": {
    "type": ["object", "string"],
    "docDescription": "Specify environment variables to be injected when using --env <env_name>"
  },
  "max_memory_restart": {
    "type": ["string", "number"],
    "regex": "^\\d+(G|M|K)?$",
    "ext_type": "sbyte",
    "desc": "it should be a NUMBER - byte, \"[NUMBER]G\"(Gigabyte), \"[NUMBER]M\"(Megabyte) or \"[NUMBER]K\"(Kilobyte)",
    "docDescription": "Restart the app if an amount of memory is exceeded (format: /[0-9](K&#124;M&#124;G)?/ K for KB, 'M' for MB, 'G' for GB, default to B)"
  },
  "pid_file": {
    "type": "string",
    "alias": "pid",
    "docDefault": "~/.pm2/pids/app_name-id.pid",
    "docDescription": "File path where the pid of the started process is written by pm2"
  },
  "restart_delay": {
    "type": "number",
    "docDefault": 0,
    "docDescription": "Time in ms to wait before restarting a crashing app"
  },
  "exp_backoff_restart_delay": {
    "type": "number",
    "docDefault": 0,
    "docDescription": "Restart Time in ms to wait before restarting a crashing app"
  },
  "source_map_support": {
    "type": "boolean",
    "docDefault": true,
    "docDescription": "Enable or disable the source map support"
  },
  "disable_source_map_support": {
    "type": "boolean",
    "docDefault": false,
    "docDescription": "Enable or disable the source map support"
  },
  "wait_ready": {
    "type": "boolean",
    "docDefault": false,
    "docDescription": "Make the process wait for a process.send('ready')"
  },
  "instances": {
    "type": "number",
    "docDefault": 1,
    "docDescription": "Number of instances to be started in cluster mode"
  },
  "kill_timeout": {
    "type": "number",
    "docDefault": 1600,
    "docDescription": "Time in ms before sending the final SIGKILL signal after SIGINT"
  },
  "shutdown_with_message": {
    "type": "boolean",
    "docDefault": false,
    "docDescription": "Shutdown an application with process.send('shutdown') instead of process.kill(pid, SIGINT)"
  },
  "listen_timeout": {
    "type": "number",
    "docDescription": "Time in ms before forcing a reload if app is still not listening/has still note sent ready"
  },
  "cron_restart": {
    "type": "string",
    "alias": "cron",
    "docDescription": "A cron pattern to restart your app"
  },
  "merge_logs": {
    "type": "boolean",
    "alias": "combine_logs",
    "docDefault": false,
    "docDescription": "In cluster mode, merge each type of logs into a single file (instead of having one for each cluster)"
  },
  "vizion": {
    "type": "boolean",
    "default": true,
    "docDefault": "True",
    "docDescription": "Enable or disable the versioning metadatas (vizion library)"
  },
  "autorestart": {
    "type": "boolean",
    "default": true,
    "docDefault": "True",
    "docDescription": "Enable or disable auto restart after process failure"
  },
  "watch_delay": {
    "type": "number",
    "docDefault": "True",
    "docDescription": "Restart delay on file change detected"
  },
  "watch": {
    "type": ["boolean", "array", "string"],
    "docDefault": false,
    "docDescription": "Enable or disable the watch mode"
  },
  "ignore_watch": {
    "type": ["array", "string"],
    "docDescription": "List of paths to ignore (regex)"
  },
  "watch_options": {
    "type": "object",
    "docDescription": "Object that will be used as an options with chokidar (refer to chokidar documentation)"
  },
  "min_uptime": {
    "type": ["number", "string"],
    "regex": "^\\d+(h|m|s)?$",
    "desc": "it should be a NUMBER - milliseconds, \"[NUMBER]h\"(hours), \"[NUMBER]m\"(minutes) or \"[NUMBER]s\"(seconds)",
    "min": 100,
    "ext_type": "stime",
    "docDefault": 1000,
    "docDescription": "Minimum uptime of the app to be considered started (format is /[0-9]+(h&#124;m&#124;s)?/, for hours, minutes, seconds, docDefault to ms)"
  },
  "max_restarts": {
    "type": "number",
    "min": 0,
    "docDefault": 16,
    "docDescription": "Number of times a script is restarted when it exits in less than min_uptime"
  },
  "execute_command": {
    "type": "boolean"
  },
  "exec_mode": {
    "type": "string",
    "regex": "^(cluster|fork)(_mode)?$",
    "desc": "it should be \"cluster\"(\"cluster_mode\") or \"fork\"(\"fork_mode\") only",
    "docDefault": "fork",
    "docDescription": "Set the execution mode, possible values: fork&#124;cluster"
  },
  "force": {
    "type": "boolean",
    "docDefault": false,
    "docDescription": "Start a script even if it is already running (only the script path is considered)"
  },
  "append_env_to_name": {
    "type": "boolean",
    "docDefault": false,
    "docDescription": "Append the environment name to the app name"
  },
  "post_update": {
    "type": "array",
    "docDescription": "List of commands executed after a pull/upgrade operation performed from Keymetrics dashboard"
  },
  "trace": {
    "type": ["boolean"],
    "docDefault": false,
    "docDescription": "Enable or disable the transaction tracing"
  },
  "disable_trace": {
    "type": ["boolean"],
    "docDefault": true,
    "docDescription": "Enable or disable the transaction tracing"
  },
  "v8": {
    "type": ["boolean"]
  },
  "event_loop_inspector": {
    "type": ["boolean"]
  },
  "deep_monitoring": {
    "type": ["boolean"]
  },
  "increment_var": {
    "type": "string",
    "docDescription": "Specify the name of an environment variable to inject which increments for each cluster"
  },
  "instance_var": {
    "type": "string",
    "default": "NODE_APP_INSTANCE",
    "docDefault": "NODE_APP_INSTANCE",
    "docDescription": "Rename the NODE_APP_INSTANCE environment variable"
  },
  "pmx": {
    "type": "boolean",
    "default": true,
    "docDefault": "True",
    "docDescription": "Enable or disable pmx wrapping"
  },
  "automation": {
    "type": "boolean",
    "default": true,
    "docDefault": "True",
    "docDescription": "Enable or disable pmx wrapping"
  },
  "treekill": {
    "type": "boolean",
    "default": true,
    "docDefault": "True",
    "docDescription": "Only kill the main process, not detached children"
  },
  "port": {
    "type": "number",
    "docDescription": "Shortcut to inject a PORT environment variable"
  },
  "username": {
    "type": "string",
    "docDescription": "Current user that started the process"
  },
  "uid": {
    "type": ["number", "string"],
    "alias": "user",
    "docDefault": "Current user uid",
    "docDescription": "Set user id"
  },
  "gid": {
    "type": ["number", "string"],
    "docDefault": "Current user gid",
    "docDescription": "Set group id"
  },
  "windowsHide": {
    "type": "boolean",
    "docDefault": "True",
    "docDescription": "Enable or disable the Windows popup when starting an app",
    "default": true
  },
  "kill_retry_time": {
    "type": "number",
    "default": 100
  },
  "write": {
    "type": "boolean"
  },
  "io": {
    "type": "object",
    "docDescription": "Specify apm values and configuration"
  }
};
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvc2NoZW1hLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztlQUFlO0FBQ2IsWUFBVTtBQUNSLFlBQVEsUUFEQTtBQUVSLGVBQVcsSUFGSDtBQUdSLGFBQVUsTUFIRjtBQUlSLHNCQUFrQjtBQUpWLEdBREc7QUFPYixVQUFRO0FBQ04sWUFBUSxRQURGO0FBRU4sa0JBQWMsd0RBRlI7QUFHTixzQkFBa0I7QUFIWixHQVBLO0FBWWIsaUJBQWU7QUFDYixZQUFRO0FBREssR0FaRjtBQWViLGdCQUFjO0FBQ1osWUFBUSxDQUNOLFNBRE0sRUFFTixPQUZNLEVBR04sUUFITSxDQURJO0FBTVosa0JBQWMsS0FORjtBQU9aLHNCQUFrQjtBQVBOLEdBZkQ7QUF3QmIsZUFBYTtBQUNYLFlBQVEsUUFERztBQUVYLGtCQUFjLFNBRkg7QUFHWCxzQkFBa0I7QUFIUCxHQXhCQTtBQTZCYixpQkFBZTtBQUNiLFlBQVE7QUFESyxHQTdCRjtBQWdDYixTQUFPO0FBQ0wsWUFBUSxRQURIO0FBRUwsa0JBQWMsa0RBRlQ7QUFHTCxzQkFBa0I7QUFIYixHQWhDTTtBQXFDYixVQUFRO0FBQ04sWUFBUSxDQUNOLE9BRE0sRUFFTixRQUZNLENBREY7QUFLTixzQkFBa0I7QUFMWixHQXJDSztBQTRDYixzQkFBb0I7QUFDbEIsWUFBUSxRQURVO0FBRWxCLGFBQVMsYUFGUztBQUdsQixrQkFBYyxNQUhJO0FBSWxCLHNCQUFrQjtBQUpBLEdBNUNQO0FBa0RiLGVBQWE7QUFDWCxZQUFRLENBQ04sT0FETSxFQUVOLFFBRk0sQ0FERztBQUtYLGFBQVMsQ0FBQyxpQkFBRCxFQUFvQixrQkFBcEIsQ0FMRTtBQU1YLHNCQUFrQjtBQU5QLEdBbERBO0FBMERiLGNBQVk7QUFDVixZQUFRLFFBREU7QUFFVixhQUFTLENBQUMsS0FBRCxFQUFRLFFBQVIsRUFBa0IsU0FBbEIsQ0FGQztBQUdWLGtCQUFjLGdDQUhKO0FBSVYsc0JBQWtCO0FBSlIsR0ExREM7QUFnRWIsZ0JB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UTtBQURELEdBL1ZJO0FBa1diLFFBQU07QUFDSixZQUFRLFFBREo7QUFFSixzQkFBa0I7QUFGZDtBQWxXTyxDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGRlZmF1bHQge1xuICBcInNjcmlwdFwiOiB7XG4gICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgXCJyZXF1aXJlXCI6IHRydWUsXG4gICAgXCJhbGlhc1wiIDogXCJleGVjXCIsXG4gICAgXCJkb2NEZXNjcmlwdGlvblwiOiBcIlBhdGggb2YgdGhlIHNjcmlwdCB0byBsYXVuY2gsIHJlcXVpcmVkIGZpZWxkXCJcbiAgfSxcbiAgXCJuYW1lXCI6IHtcbiAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICBcImRvY0RlZmF1bHRcIjogXCJTY3JpcHQgZmlsZW5hbWUgd2l0aG91dCB0aGUgZXh0ZW5zaW9uIChhcHAgZm9yIGFwcC5qcylcIixcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiUHJvY2VzcyBuYW1lIGluIHRoZSBwcm9jZXNzIGxpc3RcIlxuICB9LFxuICBcIm5hbWVfcHJlZml4XCI6IHtcbiAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICB9LFxuICBcImZpbHRlcl9lbnZcIjoge1xuICAgIFwidHlwZVwiOiBbXG4gICAgICBcImJvb2xlYW5cIixcbiAgICAgIFwiYXJyYXlcIixcbiAgICAgIFwic3RyaW5nXCJcbiAgICBdLFxuICAgIFwiZG9jRGVmYXVsdFwiOiBmYWxzZSxcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiRW5hYmxlIGZpbHRlcmluZyBnbG9iYWwgZW52aXJvbm1lbnRzXCJcbiAgfSxcbiAgXCJuYW1lc3BhY2VcIjoge1xuICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgIFwiZG9jRGVmYXVsdFwiOiBcImRlZmF1bHRcIixcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiUHJvY2VzcyBuYW1lc3BhY2VcIlxuICB9LFxuICBcImluc3RhbGxfdXJsXCI6IHtcbiAgICBcInR5cGVcIjogXCJzdHJpbmdcIlxuICB9LFxuICBcImN3ZFwiOiB7XG4gICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgXCJkb2NEZWZhdWx0XCI6IFwiQ1dEIG9mIHRoZSBjdXJyZW50IGVudmlyb25tZW50IChmcm9tIHlvdXIgc2hlbGwpXCIsXG4gICAgXCJkb2NEZXNjcmlwdGlvblwiOiBcIkN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkgdG8gc3RhcnQgdGhlIHByb2Nlc3Mgd2l0aFwiXG4gIH0sXG4gIFwiYXJnc1wiOiB7XG4gICAgXCJ0eXBlXCI6IFtcbiAgICAgIFwiYXJyYXlcIixcbiAgICAgIFwic3RyaW5nXCJcbiAgICBdLFxuICAgIFwiZG9jRGVzY3JpcHRpb25cIjogXCJBcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgc2NyaXB0XCJcbiAgfSxcbiAgXCJleGVjX2ludGVycHJldGVyXCI6IHtcbiAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICBcImFsaWFzXCI6IFwiaW50ZXJwcmV0ZXJcIixcbiAgICBcImRvY0RlZmF1bHRcIjogXCJub2RlXCIsXG4gICAgXCJkb2NEZXNjcmlwdGlvblwiOiBcIkludGVycHJldGVyIGFic29sdXRlIHBhdGhcIlxuICB9LFxuICBcIm5vZGVfYXJnc1wiOiB7XG4gICAgXCJ0eXBlXCI6IFtcbiAgICAgIFwiYXJyYXlcIixcbiAgICAgIFwic3RyaW5nXCJcbiAgICBdLFxuICAgIFwiYWxpYXNcIjogW1wiaW50ZXJwcmV0ZXJBcmdzXCIsIFwiaW50ZXJwcmV0ZXJfYXJnc1wiXSxcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiQXJndW1lbnRzIHRvIHBhc3MgdG8gdGhlIGludGVycHJldGVyXCJcbiAgfSxcbiAgXCJvdXRfZmlsZVwiOiB7XG4gICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgXCJhbGlhc1wiOiBbXCJvdXRcIiwgXCJvdXRwdXRcIiwgXCJvdXRfbG9nXCJdLFxuICAgIFwiZG9jRGVmYXVsdFwiOiBcIn4vLnBtMi9sb2dzLzxhcHBfbmFtZT4tb3V0LmxvZ1wiLFxuICAgIFwiZG9jRGVzY3JpcHRpb25cIjogXCJGaWxlIHBhdGggZm9yIHN0ZG91dCAoZWFjaCBsaW5lIGlzIGFwcGVuZGVkIHRvIHRoaXMgZmlsZSlcIlxuICB9LFxuICBcImVycm9yX2ZpbGVcIjoge1xuICAgIFwidHlwZVwiOiBcInN0cmluZ1wiLFxuICAgIFwiYWxpYXNcIjogW1wiZXJyb3JcIiwgXCJlcnJcIiwgXCJlcnJfZmlsZVwiLCBcImVycl9sb2dcIl0sXG4gICAgXCJkb2NEZWZhdWx0XCI6IFwifi8ucG0yL2xvZ3MvPGFwcF9uYW1lPi1lcnJvci5lcnJcIixcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiRmlsZSBwYXRoIGZvciBzdGRlcnIgKGVhY2ggbGluZSBpcyBhcHBlbmRlZCB0byB0aGlzIGZpbGUpXCJcbiAgfSxcbiAgXCJsb2dfZmlsZVwiOiB7XG4gICAgXCJ0eXBlXCI6IFtcbiAgICAgIFwiYm9vbGVhblwiLFxuICAgICAgXCJzdHJpbmdcIlxuICAgIF0sXG4gICAgXCJhbGlhc1wiOiBcImxvZ1wiLFxuICAgIFwiZG9jRGVmYXVsdFwiOiBcIi9kZXYvbnVsbFwiLFxuICAgIFwiZG9jRGVzY3JpcHRpb25cIjogXCJGaWxlIHBhdGggZm9yIGNvbWJpbmVkIHN0ZG91dCBhbmQgc3RkZXJyIChlYWNoIGxpbmUgaXMgYXBwZW5kZWQgdG8gdGhpcyBmaWxlKVwiXG4gIH0sXG4gIFwiZGlzYWJsZV9sb2dzXCI6IHtcbiAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgXCJkb2NEZWZhdWx0XCI6IGZhbHNlLFxuICAgIFwiZG9jRGVzY3JpcHRpb25cIjogXCJEaXNhYmxlIGFsbCBsb2dzIHN0b3JhZ2VcIlxuICB9LFxuICBcImxvZ190eXBlXCI6IHtcbiAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiRGVmaW5lIGEgc3BlY2lmaWMgbG9nIG91dHB1dCB0eXBlLCBwb3NzaWJsZSB2YWx1ZToganNvblwiXG4gIH0sXG4gIFwibG9nX2RhdGVfZm9ybWF0XCI6IHtcbiAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiRm9ybWF0IGZvciBsb2cgdGltZXN0YW1wcyBpbiBkYXkuanMgZm9ybWF0IChlZyBZWVlZLU1NLUREIEhIOm1tIFopXCJcbiAgfSxcbiAgXCJ0aW1lXCI6IHtcbiAgICBcInR5cGVcIjogXCJib29sZWFuXCJcbiAgfSxcbiAgXCJlbnZcIjoge1xuICAgIFwidHlwZVwiOiBbXG4gICAgICBcIm9iamVjdFwiLFxuICAgICAgXCJzdHJpbmdcIlxuICAgIF0sXG4gICAgXCJkb2NEZXNjcmlwdGlvblwiOiBcIlNwZWNpZnkgZW52aXJvbm1lbnQgdmFyaWFibGVzIHRvIGJlIGluamVjdGVkXCJcbiAgfSxcbiAgXCJeZW52X1xcXFxTKiRcIjoge1xuICAgIFwidHlwZVwiOiBbXG4gICAgICBcIm9iamVjdFwiLFxuICAgICAgXCJzdHJpbmdcIlxuICAgIF0sXG4gICAgXCJkb2NEZXNjcmlwdGlvblwiOiBcIlNwZWNpZnkgZW52aXJvbm1lbnQgdmFyaWFibGVzIHRvIGJlIGluamVjdGVkIHdoZW4gdXNpbmcgLS1lbnYgPGVudl9uYW1lPlwiXG4gIH0sXG4gIFwibWF4X21lbW9yeV9yZXN0YXJ0XCI6IHtcbiAgICBcInR5cGVcIjogW1xuICAgICAgXCJzdHJpbmdcIixcbiAgICAgIFwibnVtYmVyXCJcbiAgICBdLFxuICAgIFwicmVnZXhcIjogXCJeXFxcXGQrKEd8TXxLKT8kXCIsXG4gICAgXCJleHRfdHlwZVwiOiBcInNieXRlXCIsXG4gICAgXCJkZXNjXCI6IFwiaXQgc2hvdWxkIGJlIGEgTlVNQkVSIC0gYnl0ZSwgXFxcIltOVU1CRVJdR1xcXCIoR2lnYWJ5dGUpLCBcXFwiW05VTUJFUl1NXFxcIihNZWdhYnl0ZSkgb3IgXFxcIltOVU1CRVJdS1xcXCIoS2lsb2J5dGUpXCIsXG4gICAgXCJkb2NEZXNjcmlwdGlvblwiOiBcIlJlc3RhcnQgdGhlIGFwcCBpZiBhbiBhbW91bnQgb2YgbWVtb3J5IGlzIGV4Y2VlZGVkIChmb3JtYXQ6IC9bMC05XShLJiMxMjQ7TSYjMTI0O0cpPy8gSyBmb3IgS0IsICdNJyBmb3IgTUIsICdHJyBmb3IgR0IsIGRlZmF1bHQgdG8gQilcIlxuICB9LFxuICBcInBpZF9maWxlXCI6IHtcbiAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICBcImFsaWFzXCI6IFwicGlkXCIsXG4gICAgXCJkb2NEZWZhdWx0XCI6IFwifi8ucG0yL3BpZHMvYXBwX25hbWUtaWQucGlkXCIsXG4gICAgXCJkb2NEZXNjcmlwdGlvblwiOiBcIkZpbGUgcGF0aCB3aGVyZSB0aGUgcGlkIG9mIHRoZSBzdGFydGVkIHByb2Nlc3MgaXMgd3JpdHRlbiBieSBwbTJcIlxuICB9LFxuICBcInJlc3RhcnRfZGVsYXlcIjoge1xuICAgIFwidHlwZVwiIDogXCJudW1iZXJcIixcbiAgICBcImRvY0RlZmF1bHRcIjogMCxcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiVGltZSBpbiBtcyB0byB3YWl0IGJlZm9yZSByZXN0YXJ0aW5nIGEgY3Jhc2hpbmcgYXBwXCJcbiAgfSxcbiAgXCJleHBfYmFja29mZl9yZXN0YXJ0X2RlbGF5XCI6IHtcbiAgICBcInR5cGVcIjogXCJudW1iZXJcIixcbiAgICBcImRvY0RlZmF1bHRcIjogMCxcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiUmVzdGFydCBUaW1lIGluIG1zIHRvIHdhaXQgYmVmb3JlIHJlc3RhcnRpbmcgYSBjcmFzaGluZyBhcHBcIlxuICB9LFxuICBcInNvdXJjZV9tYXBfc3VwcG9ydFwiOiB7XG4gICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgIFwiZG9jRGVmYXVsdFwiOiB0cnVlLFxuICAgIFwiZG9jRGVzY3JpcHRpb25cIjogXCJFbmFibGUgb3IgZGlzYWJsZSB0aGUgc291cmNlIG1hcCBzdXBwb3J0XCJcbiAgfSxcbiAgXCJkaXNhYmxlX3NvdXJjZV9tYXBfc3VwcG9ydFwiOiB7XG4gICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgIFwiZG9jRGVmYXVsdFwiOiBmYWxzZSxcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiRW5hYmxlIG9yIGRpc2FibGUgdGhlIHNvdXJjZSBtYXAgc3VwcG9ydFwiXG4gIH0sXG4gIFwid2FpdF9yZWFkeVwiOiB7XG4gICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgIFwiZG9jRGVmYXVsdFwiOiBmYWxzZSxcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiTWFrZSB0aGUgcHJvY2VzcyB3YWl0IGZvciBhIHByb2Nlc3Muc2VuZCgncmVhZHknKVwiXG4gIH0sXG4gIFwiaW5zdGFuY2VzXCI6IHtcbiAgICBcInR5cGVcIjogXCJudW1iZXJcIixcbiAgICBcImRvY0RlZmF1bHRcIjogMSxcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiTnVtYmVyIG9mIGluc3RhbmNlcyB0byBiZSBzdGFydGVkIGluIGNsdXN0ZXIgbW9kZVwiXG4gIH0sXG4gIFwia2lsbF90aW1lb3V0XCI6IHtcbiAgICBcInR5cGVcIjogXCJudW1iZXJcIixcbiAgICBcImRvY0RlZmF1bHRcIjogMTYwMCxcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiVGltZSBpbiBtcyBiZWZvcmUgc2VuZGluZyB0aGUgZmluYWwgU0lHS0lMTCBzaWduYWwgYWZ0ZXIgU0lHSU5UXCJcbiAgfSxcbiAgXCJzaHV0ZG93bl93aXRoX21lc3NhZ2VcIjoge1xuICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICBcImRvY0RlZmF1bHRcIjogZmFsc2UsXG4gICAgXCJkb2NEZXNjcmlwdGlvblwiOiBcIlNodXRkb3duIGFuIGFwcGxpY2F0aW9uIHdpdGggcHJvY2Vzcy5zZW5kKCdzaHV0ZG93bicpIGluc3RlYWQgb2YgcHJvY2Vzcy5raWxsKHBpZCwgU0lHSU5UKVwiXG4gIH0sXG4gIFwibGlzdGVuX3RpbWVvdXRcIjoge1xuICAgIFwidHlwZVwiOiBcIm51bWJlclwiLFxuICAgIFwiZG9jRGVzY3JpcHRpb25cIjogXCJUaW1lIGluIG1zIGJlZm9yZSBmb3JjaW5nIGEgcmVsb2FkIGlmIGFwcCBpcyBzdGlsbCBub3QgbGlzdGVuaW5nL2hhcyBzdGlsbCBub3RlIHNlbnQgcmVhZHlcIlxuICB9LFxuICBcImNyb25fcmVzdGFydFwiOiB7XG4gICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgXCJhbGlhc1wiOiBcImNyb25cIixcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiQSBjcm9uIHBhdHRlcm4gdG8gcmVzdGFydCB5b3VyIGFwcFwiXG4gIH0sXG4gIFwibWVyZ2VfbG9nc1wiOiB7XG4gICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgIFwiYWxpYXNcIiA6IFwiY29tYmluZV9sb2dzXCIsXG4gICAgXCJkb2NEZWZhdWx0XCI6IGZhbHNlLFxuICAgIFwiZG9jRGVzY3JpcHRpb25cIjogXCJJbiBjbHVzdGVyIG1vZGUsIG1lcmdlIGVhY2ggdHlwZSBvZiBsb2dzIGludG8gYSBzaW5nbGUgZmlsZSAoaW5zdGVhZCBvZiBoYXZpbmcgb25lIGZvciBlYWNoIGNsdXN0ZXIpXCJcbiAgfSxcbiAgXCJ2aXppb25cIjoge1xuICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICBcImRlZmF1bHRcIiA6IHRydWUsXG4gICAgXCJkb2NEZWZhdWx0XCIgOiBcIlRydWVcIixcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiRW5hYmxlIG9yIGRpc2FibGUgdGhlIHZlcnNpb25pbmcgbWV0YWRhdGFzICh2aXppb24gbGlicmFyeSlcIlxuICB9LFxuICBcImF1dG9yZXN0YXJ0XCI6IHtcbiAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgXCJkZWZhdWx0XCI6IHRydWUsXG4gICAgXCJkb2NEZWZhdWx0XCI6IFwiVHJ1ZVwiLFxuICAgIFwiZG9jRGVzY3JpcHRpb25cIjogXCJFbmFibGUgb3IgZGlzYWJsZSBhdXRvIHJlc3RhcnQgYWZ0ZXIgcHJvY2VzcyBmYWlsdXJlXCJcbiAgfSxcbiAgXCJ3YXRjaF9kZWxheVwiOiB7XG4gICAgXCJ0eXBlXCI6IFwibnVtYmVyXCIsXG4gICAgXCJkb2NEZWZhdWx0XCI6IFwiVHJ1ZVwiLFxuICAgIFwiZG9jRGVzY3JpcHRpb25cIjogXCJSZXN0YXJ0IGRlbGF5IG9uIGZpbGUgY2hhbmdlIGRldGVjdGVkXCJcbiAgfSxcbiAgXCJ3YXRjaFwiOiB7XG4gICAgXCJ0eXBlXCI6IFtcbiAgICAgIFwiYm9vbGVhblwiLFxuICAgICAgXCJhcnJheVwiLFxuICAgICAgXCJzdHJpbmdcIlxuICAgIF0sXG4gICAgXCJkb2NEZWZhdWx0XCI6IGZhbHNlLFxuICAgIFwiZG9jRGVzY3JpcHRpb25cIjogXCJFbmFibGUgb3IgZGlzYWJsZSB0aGUgd2F0Y2ggbW9kZVwiXG4gIH0sXG4gIFwiaWdub3JlX3dhdGNoXCI6IHtcbiAgICBcInR5cGVcIjogW1xuICAgICAgXCJhcnJheVwiLFxuICAgICAgXCJzdHJpbmdcIlxuICAgIF0sXG4gICAgXCJkb2NEZXNjcmlwdGlvblwiOiBcIkxpc3Qgb2YgcGF0aHMgdG8gaWdub3JlIChyZWdleClcIlxuICB9LFxuICBcIndhdGNoX29wdGlvbnNcIjoge1xuICAgIFwidHlwZVwiOiBcIm9iamVjdFwiLFxuICAgIFwiZG9jRGVzY3JpcHRpb25cIjogXCJPYmplY3QgdGhhdCB3aWxsIGJlIHVzZWQgYXMgYW4gb3B0aW9ucyB3aXRoIGNob2tpZGFyIChyZWZlciB0byBjaG9raWRhciBkb2N1bWVudGF0aW9uKVwiXG4gIH0sXG4gIFwibWluX3VwdGltZVwiOiB7XG4gICAgXCJ0eXBlXCI6IFtcbiAgICAgIFwibnVtYmVyXCIsXG4gICAgICBcInN0cmluZ1wiXG4gICAgXSxcbiAgICBcInJlZ2V4XCI6IFwiXlxcXFxkKyhofG18cyk/JFwiLFxuICAgIFwiZGVzY1wiOiBcIml0IHNob3VsZCBiZSBhIE5VTUJFUiAtIG1pbGxpc2Vjb25kcywgXFxcIltOVU1CRVJdaFxcXCIoaG91cnMpLCBcXFwiW05VTUJFUl1tXFxcIihtaW51dGVzKSBvciBcXFwiW05VTUJFUl1zXFxcIihzZWNvbmRzKVwiLFxuICAgIFwibWluXCI6IDEwMCxcbiAgICBcImV4dF90eXBlXCI6IFwic3RpbWVcIixcbiAgICBcImRvY0RlZmF1bHRcIjogMTAwMCxcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiTWluaW11bSB1cHRpbWUgb2YgdGhlIGFwcCB0byBiZSBjb25zaWRlcmVkIHN0YXJ0ZWQgKGZvcm1hdCBpcyAvWzAtOV0rKGgmIzEyNDttJiMxMjQ7cyk/LywgZm9yIGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzLCBkb2NEZWZhdWx0IHRvIG1zKVwiXG4gIH0sXG4gIFwibWF4X3Jlc3RhcnRzXCI6IHtcbiAgICBcInR5cGVcIjogXCJudW1iZXJcIixcbiAgICBcIm1pblwiOiAwLFxuICAgIFwiZG9jRGVmYXVsdFwiOiAxNixcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiTnVtYmVyIG9mIHRpbWVzIGEgc2NyaXB0IGlzIHJlc3RhcnRlZCB3aGVuIGl0IGV4aXRzIGluIGxlc3MgdGhhbiBtaW5fdXB0aW1lXCJcbiAgfSxcbiAgXCJleGVjdXRlX2NvbW1hbmRcIjoge1xuICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIlxuICB9LFxuICBcImV4ZWNfbW9kZVwiOiB7XG4gICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgXCJyZWdleFwiOiBcIl4oY2x1c3Rlcnxmb3JrKShfbW9kZSk/JFwiLFxuICAgIFwiZGVzY1wiOiBcIml0IHNob3VsZCBiZSBcXFwiY2x1c3RlclxcXCIoXFxcImNsdXN0ZXJfbW9kZVxcXCIpIG9yIFxcXCJmb3JrXFxcIihcXFwiZm9ya19tb2RlXFxcIikgb25seVwiLFxuICAgIFwiZG9jRGVmYXVsdFwiOiBcImZvcmtcIixcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiU2V0IHRoZSBleGVjdXRpb24gbW9kZSwgcG9zc2libGUgdmFsdWVzOiBmb3JrJiMxMjQ7Y2x1c3RlclwiXG4gIH0sXG4gIFwiZm9yY2VcIjoge1xuICAgIFwidHlwZVwiOiBcImJvb2xlYW5cIixcbiAgICBcImRvY0RlZmF1bHRcIjogZmFsc2UsXG4gICAgXCJkb2NEZXNjcmlwdGlvblwiOiBcIlN0YXJ0IGEgc2NyaXB0IGV2ZW4gaWYgaXQgaXMgYWxyZWFkeSBydW5uaW5nIChvbmx5IHRoZSBzY3JpcHQgcGF0aCBpcyBjb25zaWRlcmVkKVwiXG4gIH0sXG4gIFwiYXBwZW5kX2Vudl90b19uYW1lXCI6IHtcbiAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgXCJkb2NEZWZhdWx0XCI6IGZhbHNlLFxuICAgIFwiZG9jRGVzY3JpcHRpb25cIjogXCJBcHBlbmQgdGhlIGVudmlyb25tZW50IG5hbWUgdG8gdGhlIGFwcCBuYW1lXCJcbiAgfSxcbiAgXCJwb3N0X3VwZGF0ZVwiOiB7XG4gICAgXCJ0eXBlXCI6IFwiYXJyYXlcIixcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiTGlzdCBvZiBjb21tYW5kcyBleGVjdXRlZCBhZnRlciBhIHB1bGwvdXBncmFkZSBvcGVyYXRpb24gcGVyZm9ybWVkIGZyb20gS2V5bWV0cmljcyBkYXNoYm9hcmRcIlxuICB9LFxuICBcInRyYWNlXCI6IHtcbiAgICBcInR5cGVcIjogW1xuICAgICAgXCJib29sZWFuXCJcbiAgICBdLFxuICAgIFwiZG9jRGVmYXVsdFwiOiBmYWxzZSxcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiRW5hYmxlIG9yIGRpc2FibGUgdGhlIHRyYW5zYWN0aW9uIHRyYWNpbmdcIlxuICB9LFxuICBcImRpc2FibGVfdHJhY2VcIjoge1xuICAgIFwidHlwZVwiOiBbXG4gICAgICBcImJvb2xlYW5cIlxuICAgIF0sXG4gICAgXCJkb2NEZWZhdWx0XCI6IHRydWUsXG4gICAgXCJkb2NEZXNjcmlwdGlvblwiOiBcIkVuYWJsZSBvciBkaXNhYmxlIHRoZSB0cmFuc2FjdGlvbiB0cmFjaW5nXCJcbiAgfSxcbiAgXCJ2OFwiOiB7XG4gICAgXCJ0eXBlXCI6IFtcbiAgICAgIFwiYm9vbGVhblwiXG4gICAgXVxuICB9LFxuICBcImV2ZW50X2xvb3BfaW5zcGVjdG9yXCI6IHtcbiAgICBcInR5cGVcIjogW1xuICAgICAgXCJib29sZWFuXCJcbiAgICBdXG4gIH0sXG4gIFwiZGVlcF9tb25pdG9yaW5nXCI6IHtcbiAgICBcInR5cGVcIjogW1xuICAgICAgXCJib29sZWFuXCJcbiAgICBdXG4gIH0sXG4gIFwiaW5jcmVtZW50X3ZhclwiOiB7XG4gICAgXCJ0eXBlXCI6IFwic3RyaW5nXCIsXG4gICAgXCJkb2NEZXNjcmlwdGlvblwiOiBcIlNwZWNpZnkgdGhlIG5hbWUgb2YgYW4gZW52aXJvbm1lbnQgdmFyaWFibGUgdG8gaW5qZWN0IHdoaWNoIGluY3JlbWVudHMgZm9yIGVhY2ggY2x1c3RlclwiXG4gIH0sXG4gIFwiaW5zdGFuY2VfdmFyXCI6IHtcbiAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICBcImRlZmF1bHRcIjogXCJOT0RFX0FQUF9JTlNUQU5DRVwiLFxuICAgIFwiZG9jRGVmYXVsdFwiOiBcIk5PREVfQVBQX0lOU1RBTkNFXCIsXG4gICAgXCJkb2NEZXNjcmlwdGlvblwiOiBcIlJlbmFtZSB0aGUgTk9ERV9BUFBfSU5TVEFOQ0UgZW52aXJvbm1lbnQgdmFyaWFibGVcIlxuICB9LFxuICBcInBteFwiOiB7XG4gICAgXCJ0eXBlXCI6IFwiYm9vbGVhblwiLFxuICAgIFwiZGVmYXVsdFwiOiB0cnVlLFxuICAgIFwiZG9jRGVmYXVsdFwiOiBcIlRydWVcIixcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiRW5hYmxlIG9yIGRpc2FibGUgcG14IHdyYXBwaW5nXCJcbiAgfSxcbiAgXCJhdXRvbWF0aW9uXCI6IHtcbiAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgXCJkZWZhdWx0XCI6IHRydWUsXG4gICAgXCJkb2NEZWZhdWx0XCI6IFwiVHJ1ZVwiLFxuICAgIFwiZG9jRGVzY3JpcHRpb25cIjogXCJFbmFibGUgb3IgZGlzYWJsZSBwbXggd3JhcHBpbmdcIlxuICB9LFxuICBcInRyZWVraWxsXCI6IHtcbiAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgXCJkZWZhdWx0XCI6IHRydWUsXG4gICAgXCJkb2NEZWZhdWx0XCI6IFwiVHJ1ZVwiLFxuICAgIFwiZG9jRGVzY3JpcHRpb25cIjogXCJPbmx5IGtpbGwgdGhlIG1haW4gcHJvY2Vzcywgbm90IGRldGFjaGVkIGNoaWxkcmVuXCJcbiAgfSxcbiAgXCJwb3J0XCI6IHtcbiAgICBcInR5cGVcIjogXCJudW1iZXJcIixcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiU2hvcnRjdXQgdG8gaW5qZWN0IGEgUE9SVCBlbnZpcm9ubWVudCB2YXJpYWJsZVwiXG4gIH0sXG4gIFwidXNlcm5hbWVcIiA6IHtcbiAgICBcInR5cGVcIjogXCJzdHJpbmdcIixcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiQ3VycmVudCB1c2VyIHRoYXQgc3RhcnRlZCB0aGUgcHJvY2Vzc1wiXG4gIH0sXG4gIFwidWlkXCI6IHtcbiAgICBcInR5cGVcIiA6IFtcbiAgICAgIFwibnVtYmVyXCIsXG4gICAgICBcInN0cmluZ1wiXG4gICAgXSxcbiAgICBcImFsaWFzXCI6IFwidXNlclwiLFxuICAgIFwiZG9jRGVmYXVsdFwiOiBcIkN1cnJlbnQgdXNlciB1aWRcIixcbiAgICBcImRvY0Rlc2NyaXB0aW9uXCI6IFwiU2V0IHVzZXIgaWRcIlxuICB9LFxuICBcImdpZFwiOiB7XG4gICAgXCJ0eXBlXCIgOiBbXG4gICAgICBcIm51bWJlclwiLFxuICAgICAgXCJzdHJpbmdcIlxuICAgIF0sXG4gICAgXCJkb2NEZWZhdWx0XCI6IFwiQ3VycmVudCB1c2VyIGdpZFwiLFxuICAgIFwiZG9jRGVzY3JpcHRpb25cIjogXCJTZXQgZ3JvdXAgaWRcIlxuICB9LFxuICBcIndpbmRvd3NIaWRlXCI6IHtcbiAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXG4gICAgXCJkb2NEZWZhdWx0XCI6IFwiVHJ1ZVwiLFxuICAgIFwiZG9jRGVzY3JpcHRpb25cIjogXCJFbmFibGUgb3IgZGlzYWJsZSB0aGUgV2luZG93cyBwb3B1cCB3aGVuIHN0YXJ0aW5nIGFuIGFwcFwiLFxuICAgIFwiZGVmYXVsdFwiOiB0cnVlXG4gIH0sXG4gIFwia2lsbF9yZXRyeV90aW1lXCI6IHtcbiAgICBcInR5cGVcIjogXCJudW1iZXJcIixcbiAgICBcImRlZmF1bHRcIiA6IDEwMFxuICB9LFxuICBcIndyaXRlXCI6IHtcbiAgICBcInR5cGVcIjogXCJib29sZWFuXCJcbiAgfSxcbiAgXCJpb1wiOiB7XG4gICAgXCJ0eXBlXCI6IFwib2JqZWN0XCIsXG4gICAgXCJkb2NEZXNjcmlwdGlvblwiOiBcIlNwZWNpZnkgYXBtIHZhbHVlcyBhbmQgY29uZmlndXJhdGlvblwiXG4gIH1cbn1cbiJdfQ==