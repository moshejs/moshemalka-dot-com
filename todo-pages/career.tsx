import styles from '@/styles/Career.module.css';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';

const positions = [
    {
      company: 'Peloton Interactive',
      title: 'Senior Software Engineer',
      role: 'Acting Staff Engineer',
      dates: 'MARCH 2020 - PRESENT',
      responsibilities: [
        'Engaged in both technical next-gen ecomm workstream and cross-functional ecomm marketing team.',
        'Focused on platform optimization utilizing NextJS, GraphQL, and GitHub Actions, working closely with SRE/DevOps to launch Serverless NextJS on AWS using Contentful as a headless CMS in the next-gen ecomm workstream.',
        'Migrated e-commerce website from React to NextJS & GraphQL.',
        'Improved page load by focusing on core web vitals on our e-commerce website, which dramatically increased conversions.',
        'Redesigned the following pages: home, bike, bike-plus by developing reusable UI modules and focusing on new product launches using contentful and internal design system; utilizing segment for user analytics.',
        'Engaged in working groups and technical discussions: Hosted: Blockchain/Cryptocurrency, Member: Onboarding, Web Architecture and Agile Advocates',
      ],
    },
    {
      company: 'CBRE Hana',
      title: 'Senior Software Engineer',
      role: 'Acting Tech Lead',
      dates: 'MARCH 2019 - DECEMBER 2019',
      responsibilities: [
        'Engaged in both Marketing Tech team and Operations Tech workstream.',
        'Proposed, designed, planned, architected, led, developed, and delivered cross-functional Design System and UI Library using SCSS (deployed via cloud functions and S3) and coached devs on best practices for use and extension.',
        'Developed client-facing coworking portal and sign-in page on Azure ADB2C using UI Library.',
        'Maintained and extended React marketing web app.',
        'Migrated marketing app from React to use GatsbyJS & GraphQL and wrote unit tests using Jest.',
      ],
    },
    {
      company: 'ICE BondPoint',
      title: 'Senior Software Engineer',
      dates: 'OCTOBER 2018 - JANUARY 2019',
      responsibilities: [
        'Led front end development for internal RFQ web app using Angular and NodeJS for institutional clients to have a fresh experience when trading bonds.',
        'Consulted and mentored backend team with best practices for RESTful API patterns.',
        'Developed algorithm for extracting, validating, and polling CUSIP information from clipboard data.',
      ],
    },
    {
      company: 'CPS Central',
      title: 'Tech Lead',
      dates: 'JUNE 2018 - OCTOBER 2018',
      responsibilities: [
        'Led front end development for CYA, a web application using Angular and NodeJS.',
        'Improved Core Web Vitals such as reduced page load (<200ms) with SSR, lazy-loading, and code-splitting.',
        'Introduced and implemented scrum/agile rituals and principles.',
        'Coached Jr devs on Angular patterns (e.g. observables).',
        'Negotiated with executives to improve code quality, morale, and culture to attract talent.',
        'Modified interview process to be aligned with industry (code challenges, take home, etc.).',
      ],
    },
    {
      company: 'HitBit',
      title: 'Senior Software Engineer',
      dates: 'OCTOBER 2017 - MAY 2018',
      responsibilities: [
        'Developed a high-frequency crypto-trading algorithm to conduct cross-exchange arbitrage (runtime <26ms) using Node, Kafka, Typescript, and Google Cloud Platform.',
      ],
    },
    {
      company: 'Conquest Motor Cars',
      title: 'Full Stack Engineer',
      dates: 'DECEMBER 2016 - SEPTEMBER 2017',
      responsibilities: [
         'Led, developed, and delivered scalable front-end car configuration + leasing wizard using Angular and converting existing price engine [aggregated datasets from financial institutions] written in C# app into a REST API.',
      ],
    },
];


function Career() {
    return (
      <div className={styles.container}>
        <ul className={styles.timeline}>
          {positions.map((position, index) => (
            <li key={index} className={styles.timelineItem}>
              <div className={styles.timelineItemDot}></div>
              <div className={styles.timelineContent}>
                <h3>{position.company}</h3>
                <h4>{position.title}</h4>
                <span className={styles.date}>{position.dates}</span>
                <ul>
                  {position.responsibilities.map((responsibility, resIndex) => (
                    <li key={resIndex}>{responsibility}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  
  export default Career;