import { Link } from 'react-router-dom';
import './Button.css';

/**
 * Reusable button. Renders as a react-router <Link> when `to` is provided,
 * as an <a> when `href` is provided, otherwise as a native <button>.
 */
export default function Button({
  children,
  to,
  href,
  variant = 'primary',
  size = 'md',
  type = 'button',
  fullWidth = false,
  onClick,
  ...rest
}) {
  const className = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? 'btn--block' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link to={to} className={className} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    const isExternal = /^https?:/i.test(href);
    return (
      <a
        href={href}
        className={className}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={className} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}
