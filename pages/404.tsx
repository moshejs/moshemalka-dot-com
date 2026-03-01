export default function Custom404() {
    return (
      <>
        <style>{`
          .full-height {
            height: 100%;
          }
          .cover-img {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            object-fit: cover;
            object-position: top;
          }
          .center-content {
            max-width: 1200px;
            padding: 32px 24px;
            text-align: center;
            margin: 0 auto;
          }
          .large-text {
            font-size: 48px;
            font-weight: bold;
          }
          .small-text {
            font-size: 16px;
            font-weight: 600;
          }
          .text-white {
            color: white;
          }
          .opacity-70 {
            opacity: 0.7;
          }
          .margin-top {
            margin-top: 16px;
          }
          .flex-center {
            display: flex;
            justify-content: center;
          }
          .link-decoration {
            text-decoration: none;
          }
        `}</style>
        <main className="full-height relative isolate">
          <img
            src="https://images.unsplash.com/photo-1545972154-9bb223aac798?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=3050&q=80&exp=8&con=-15&sat=-75"
            alt=""
            className="cover-img -z-10"
          />
          <div className="center-content">
            <p className="small-text text-white">404</p>
            <h1 className="large-text text-white margin-top">Page not found</h1>
            <p className="small-text text-white opacity-70 margin-top">Sorry, we couldn’t find the page you’re looking for.</p>
            <div className="flex-center margin-top">
              <a href="#" className="link-decoration small-text text-white">
                <span aria-hidden="true">&larr;</span> Back to home
              </a>
            </div>
          </div>
        </main>
      </>
    )
  }
  