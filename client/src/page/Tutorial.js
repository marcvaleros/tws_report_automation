import { Link } from 'react-router-dom';

function Tutorial() {
  return (
    <div className="font-poppins flex flex-col justify-center items-center min-h-screen">
        <a href="https://www.loom.com/share/e6b9ca1e6a57453c9b8e94d90d86a44b?sid=cee7b9b5-70d7-444d-842d-7cb972bcfd32" target="_blank" rel="noopener noreferrer" className='text-white font-bold text-lg bg-primaryOrange px-4 py-2 rounded-md m-6'>Loom Video Link Here</a>
        <h1 className="text-blue-900 font-semibold text-2xl my-4">How to get the JWT credential in RingCentral: </h1>
        <ul className="flex flex-col space-y-6 justify-center items-center cursor-pointer">
          <li className="flex flex-row gap-4 items-center justify-center bg-slate-100 mx-4">
            <p className="px-4 max-w-sm"><b className="text-primaryOrange">Step 1: </b><span><a href="https://developers.ringcentral.com/" target="_blank" rel="noopener noreferrer" className='text-blue-600 underline'>Visit RingCentral Developers</a></span> page and create a developer account using your existing Ring Central account. If you already have one, just click login.</p>
            <img src='/tutorial/0.png' alt='' width={1000} height={1000}/>
          </li>
          <li className="flex flex-row gap-4 items-center justify-center bg-slate-100 mx-4">
          <p className="px-4 max-w-sm"><b className="text-primaryOrange">Step 2: </b>After logging in, you will be redirected to developer console. Navigate to Apps to view all applications of HomeFront Brands and click TWS_Recording_Automation.</p>
            <img src='/tutorial/1.png' alt='' width={1000} height={1000}/>
          </li>
          <li className="flex flex-row gap-4 items-center justify-center bg-slate-100 mx-4">
          <p className="px-4 max-w-sm"><b className="text-primaryOrange">Step 3: </b>In the dashboard, go to the Production Credentials and copy the Client ID to your clipboard, we will be using this in the next steps.</p>
            <img src='/tutorial/2.png' alt='' width={1000} height={1000}/>
          </li>
          <li className="flex flex-row gap-4 items-center justify-center bg-slate-100 mx-4">
          <p className="px-4 max-w-sm"><b className="text-primaryOrange">Step 4: </b>Next, go to the top right corner and select your name to open a menu and select Credentials.</p>
            <img src='/tutorial/step-4.png' alt='' width={1000} height={1000}/>
          </li>
          <li className="flex flex-row gap-4 items-center justify-center bg-slate-100 mx-4">
          <p className="px-4 max-w-sm"><b className="text-primaryOrange">Step 5: </b>Click the 'Create JWT' button at the right corner of the Credentials section. </p>
            <img src='/tutorial/6.png' alt='' width={1000} height={1000}/>
          </li>
          <li className="flex flex-row gap-4 items-center justify-center bg-slate-100 mx-4">
          <p className="px-4 max-w-sm"><b className="text-primaryOrange">Step 6: </b>Fill up the form to acquire the JWT. Set 'TWS_RingCentral_Automation' as the label. Select 'Production' as the environment and check the 'Only specific apps of my choice' checkbox. </p>
            <img src='/tutorial/7.png' alt='' width={1000} height={1000}/>
          </li>
          <li className="flex flex-row gap-4 items-center justify-center bg-slate-100 mx-4">
          <p className="px-4 max-w-sm"><b className="text-primaryOrange">Step 7: </b> Paste the Client ID that we copied earlier and click on the 'Add App' button and proceed with clicking 'Create JWT' button at the bottom.</p>
            <img src='/tutorial/8.png' alt='' width={1000} height={1000}/>
          </li>
          <li className="flex flex-row gap-4 items-center justify-center bg-slate-100 mx-4">
          <p className="px-4 max-w-sm"><b className="text-primaryOrange">Step 8: </b> Finally, after creating the JWT, copy the JWT token and input it in the RingCentral Automation configuration page.</p>
            <img src='/tutorial/9.png' alt='' width={1000} height={1000}/>
          </li>
        </ul>

        <Link to='/' className='text-2xl bg-primaryOrange font-bold px-6 m-6 text-white rounded-md py-8 animate-bounce'>Go Back to Homepage</Link>
    </div>
  );
}

export default Tutorial;
