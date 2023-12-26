import Head from 'next/head';
import Script from 'next/script'
import React, { useState, useEffect } from 'react';
// import Header from '../components/Header';
// import Footer from '../components/Footer';

const companies = [{ title: 'Peloton', url: 'https://www.onepeloton.com', color: 'rgb(223, 28, 47)' }, { title: 'CBRE', url: 'https://www.cbre.com', color: 'darkgreen' }, { title: 'ICE', url: 'https://www.ice.com', color: 'rgb(113, 197, 232)' }]

function CompanyCycle() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
      setCurrentIndex(0); // Set the initial index after mount

      const interval = setInterval(() => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % companies.length);
      }, 1200);

      return () => clearInterval(interval);
  }, []);

    return (
        <span className="company-cycle">
            I&apos;m a former{' '}
            {companies.map((company, index) => (
                <span
                    key={company.title}
                    className={`company-name ${currentIndex === index ? 'active' : ''}`}
                >
                    <a href={company.url} style={{textDecoration: 'none', color: company.color }}>{company.title} </a>
                </span>
            ))}
            Senior Software Engineer.
        </span>
    );
}

const CareerBlockA = () => (<p>
  I was formerly at{' '}
  {companies.map((company, index) => (
    <span key={index}>
      <a style={{textDecoration: 'none', color: company.color}} href={company.url}>{company.title}</a>
      {index !== companies.length - 1 ? ', ': ' '}
    </span>
  ))} 
  where I have mastered the art of crafting performant and inspiring full-stack web applications.
</p>);

const CareerBlockB = () => (<p><CompanyCycle /></p>)

interface SplitTestProps {
  elements: React.FC[];
}

const SplitTest: React.FC<SplitTestProps> = ({ elements }) => {
  // Use the current date as a seed to select an index from the provided elements
  const day = new Date().getDate();
  const randomIndex = day % elements.length;
  const SelectedElement = elements[randomIndex];

  return <SelectedElement />;
};

export default function Home() {
  return (
    <div>
      <div className='container'>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-L1ETKYXNV4" />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
  
            gtag('config', 'G-L1ETKYXNV4');
          `}
        </Script>
      </div>
      <Head>
        <title>Moshe Malka | Senior Software Engineer</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Moshe Malka is a NYC born senior software engineer" />
        <meta name="keywords" content="moshe malka, software engineer new york city" />
      </Head>

      {/* <Header /> */}

      <main>
        <div id='main-container'>
          <h1 style={{fontWeight: '400', fontSize: '40px'}}>Hello</h1> {/* 🇺🇸🇮🇱 שלום */}
          <h2 style={{fontWeight: '400', fontSize: '20px'}}> My name is Moshe Malka</h2>
          <img id="image" src="moshemalka.png" />
          <ul id="social-media-icons">
            <li>
              <a
                href="https://www.linkedin.com/in/moshenyc"
                target="_blank"
                ><img className="icon" src="linkedin-logo.svg" alt="LinkedIn"
              /></a>
            </li>
            <li>
              <a href="https://stackoverflow.com/users/7381252/moshe" target="_blank"
                ><img className="icon" src="stackoverflow-logo.svg" alt="Stack Overflow"
              /></a>
            </li>
            <li>
              <a href="https://github.com/moshejs" target="_blank"
                ><img className="icon" src="github-logo.svg" alt="GitHub"
              /></a>
            </li>
          </ul>
          {/* 🇮🇱 שלום , Israeli-American*/}
          <p>I&apos;m a software visionary born in the dynamic heart of New York City, renowned for my exceptional ability to decode and harness complex patterns.</p>
          <SplitTest elements={[CareerBlockA, CareerBlockB]} />

          <p>I&apos;m the founder and CEO of <a style={{textDecoration: 'none'}} href='https://www.quentin.software' target='_blank'><b>Quentin Code</b></a> a firm that helps non-tech entrepreneurs architect digital solutions that transform their vision into a tangible, thriving reality.</p>
          </div>
      </main>

      {/* <Footer /> */}
    </div>
  );
}
