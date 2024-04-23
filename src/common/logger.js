// import { createLogger, transports, format } from 'winston';
import   { createLogger, transports, format }  from  'winston';
import  'winston-daily-rotate-file';
const { combine, timestamp, simple } = format;

const is_dev = process.env.NODE_ENV === 'development';

const file_path = (prefix) => {
  let path = "logs"
  if (process.env.NODE_ENV === 'production') {
    path = "/var/log/node backend"
  }
  return `${path}/${prefix}-%DATE%.log`
}

const fileTransporter = (log_level) => {
  const path_prefix = log_level == 'info' ? 'all' : log_level;
  return new transports.DailyRotateFile({
    level: log_level,
    filename: file_path(path_prefix),
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '7d'
  });
}

const fileRotationTransport = fileTransporter('info');
const errorFileRotationTransport = fileTransporter('error')

const default_transports = !is_dev ? [
  fileRotationTransport,
  errorFileRotationTransport
] : [];

const LOGGER = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    simple()
  ),
  transports: default_transports,
});

if (is_dev) {
  LOGGER.add(new transports.Console({
    format: simple()
  }));
}

export default  LOGGER 