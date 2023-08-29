import Link from 'next/link';

const Footer = () => (
  <footer>
    <nav>
      <Link href="https://www.linkedin.com/in/moshe-malka/" 
            className="subtle-animation" target="_blank" 
            rel="noopener noreferrer">
                LinkedIn
      </Link>
      {/* Add more links for social media profiles */}
    </nav>
  </footer>
);

export default Footer;
