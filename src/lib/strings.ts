export type Language = "en" | "ta";

export const translations = {
  en: {
    brandTitle: "JanAgni",
    brandSub: "Civic escalation, automated",
    
    // Onboarding
    onboardingTitle: "Select Language",
    onboardingSub: "Speak your complaint in English or Tamil. JanAgni drafts statutory RTI requests and Article 226 legal documents automatically.",
    onboardingContinue: "Continue",
    onboardingFooter: "Sec. 6(1) RTI & Art. 226 Escalation Enabled",
    
    // Home/Intake
    heroTitle: "Report it once. Let the fire stay on it.",
    heroSub: "Speak or type your complaint. JanAgni tracks statutory deadlines and escalates automatically if authorities fail to act.",
    micLabelTap: "Tap to speak your complaint",
    micLabelListening: "Listening...",
    micLabelReview: "Got it — review below",
    micLabelProcessing: "Analyzing audio...",
    micLabelDenied: "Mic unavailable. Type complaint directly.",
    typeFallbackLink: "Or type complaint details manually",
    transcriptBoxTitle: "Review & Edit Complaint",
    fileBtnLabel: "File this complaint",
    fileBtnProcessing: "Processing...",
    activeGrievanceTitle: "Active Complaint",
    reportNewGrievanceBtn: "Report New",
    backToActiveGrievanceBtn: "← Back to Active Grievance",
    daysLeftLabel: "Days Left",
    viewDocRti: "📄 View RTI application",
    viewDocWrit: "📄 View writ petition",
    verifyResolutionBtn: "Verify Fix & Give Feedback",
    
    // Demo Control
    demoControlTitle: "Demo Control",
    demoControlAdvance: "Advance time →",
    demoControlReset: "Reset",
    demoControlClear: "Clear DB",
    demoControlJumpTo: "Jump To:",
    
    // Nav Bar
    navHome: "Home",
    navComplaints: "Complaints",
    navOfficer: "Officer",
    
    // Complaints
    complaintsTitle: "My Complaints",
    complaintsSub: "Track active grievances and statutory escalations",
    complaintsEmptyTitle: "No complaints filed yet",
    complaintsEmptySub: "Speak or type your grievance on the home screen. JanAgni will auto-track the SLA timeline and compile drafts.",
    complaintsEmptyBtn: "File a Grievance",
    trackSla: "Track SLA",
    
    // Officer Dashboard
    officerTitle: "Ward Authority",
    officerSub: "Zone 13 · Adyar & Velachery Portal",
    kpiActive: "Active",
    kpiBreaches: "SLA Breaches (Day 30+)",
    kpiRtis: "Active RTIs",
    kpiAvgRes: "Avg Resolution",
    kpiWarningTitle: "Authority Demo Environment.",
    kpiWarningBody: "You are viewing complaints routed to Ward 172. Action responses are simulated for escalation testing.",
    tableTitle: "Grievance Compliance Register",
    tableColId: "ID",
    tableColCat: "Category",
    tableColSla: "SLA Status",
    tableColEscalation: "Escalation",
    tableColAction: "Action",
    tableSwipeAffordance: "← Swipe to view compliance metrics →",
    emptyBreachesTitle: "No Active Breaches",
    emptyBreachesSub: "All grievances are resolved or currently within their active SLA timelines.",
    
    // Resolution
    resolvedStateLabel: "Resolved State",
    verifyResolutionTitle: "Verify Resolution",
    verifyResolutionSub: "The municipal ward officer has marked this issue as resolved. Please inspect the site and confirm if the work has been completed satisfactorily.",
    detailCategory: "Grievance Category",
    detailDescription: "Citizen Statement",
    confirmResolvedBtn: "Confirm Resolved",
    notFixedBtn: "Not Actually Fixed",
    notFixedWarning: "* Selecting \"Not Actually Fixed\" will immediately reactivate the Article 226 High Court Writ Petition, notifying the Zonal Commissioner of the failure.",
    verifyingFixLoading: "Verifying Resolution...",
    registeringFailureLoading: "Registering Grievance Failure...",
    syncLedger: "Syncing Firestore registers...",
    confirmedTitle: "Resolution Confirmed",
    confirmedSub: "Grievance status finalized. Your verification has been recorded in the GCC audit ledger.",
    escalatedTitle: "Writ Re-Escalated",
    escalatedSub: "Grievance marked as unresolved. Statutory escalation has been reactivated to writ petition.",
    returningHome: "Returning home...",
  },
  ta: {
    brandTitle: "ஜனஅக்னி",
    brandSub: "தானியங்கி குறைதீர் தளம்",
    
    // Onboarding
    onboardingTitle: "மொழி தேர்வு",
    onboardingSub: "உங்கள் புகாரை ஆங்கிலம் அல்லது தமிழில் கூறலாம். அதிகாரிகள் நடவடிக்கை எடுக்கத் தவறினால் ஜனஅக்னி தானியங்கி முறையில் சட்ட ரீதியிலான ஆவணங்களை உருவாக்கும்.",
    onboardingContinue: "தொடர்க",
    onboardingFooter: "பிரிவு 6(1) RTI மற்றும் பிரிவு 226 நீதிமன்ற வழக்கு இயலுமைப்பட்டது",
    
    // Home/Intake
    heroTitle: "ஒரு முறை புகாரளிக்கவும். தொடர் அக்னியை வையுங்கள்.",
    heroSub: "உங்கள் புகாரை பேசுங்கள் அல்லது தட்டச்சு செய்யுங்கள். அதிகாரிகள் நடவடிக்கை எடுக்கத் தவறினால் ஜனஅக்னி தானியங்கி முறையில் வழக்கை நகர்த்தும்.",
    micLabelTap: "உங்கள் புகாரை கூற தட்டவும்",
    micLabelListening: "கேட்கிறது...",
    micLabelReview: "விவரங்கள் பெறப்பட்டன - சரிபார்க்கவும்",
    micLabelProcessing: "ஆடியோவை பகுப்பாய்வு செய்கிறது...",
    micLabelDenied: "மைக் வேலை செய்யவில்லை. நேரடியாக தட்டச்சு செய்யவும்.",
    typeFallbackLink: "அல்லது புகாரை நேரடியாக தட்டச்சு செய்ய",
    transcriptBoxTitle: "புகார் விவரங்களை சரிபார்க்கவும்",
    fileBtnLabel: "புகாரை பதிவு செய்க",
    fileBtnProcessing: "செயலாக்குகிறது...",
    activeGrievanceTitle: "சமர்ப்பிக்கப்பட்ட புகார்",
    reportNewGrievanceBtn: "புதிய புகார்",
    backToActiveGrievanceBtn: "← செயலில் உள்ள புகாருக்குச் செல்லவும்",
    daysLeftLabel: "நாட்கள் மீதமுள்ளன",
    viewDocRti: "📄 RTI விண்ணப்பத்தைப் பார்க்கவும்",
    viewDocWrit: "📄 நீதிமன்ற மனுவைப் பார்க்கவும்",
    verifyResolutionBtn: "தீர்வினை சரிபார்",
    
    // Demo Control
    demoControlTitle: "டெமோ கட்டுப்பாடு",
    demoControlAdvance: "நேரத்தை நகர்த்து →",
    demoControlReset: "மீட்டமை",
    demoControlClear: "தரவுகளை அழி",
    demoControlJumpTo: "நேரடி நிலை:",
    
    // Nav Bar
    navHome: "முகப்பு",
    navComplaints: "புகார்கள்",
    navOfficer: "அதிகாரி",
    
    // Complaints
    complaintsTitle: "எனது புகார்கள்",
    complaintsSub: "சமர்ப்பிக்கப்பட்ட புகார்கள் மற்றும் சட்டப்பூர்வ நகர்வுகளைக் கண்காணிக்கவும்",
    complaintsEmptyTitle: "புகார்கள் எதுவும் இதுவரை பதிவு செய்யப்படவில்லை",
    complaintsEmptySub: "முகப்பு திரையில் உங்கள் புகாரைப் பேசுங்கள் அல்லது தட்டச்சு செய்யுங்கள். ஜனஅக்னி தானியங்கி முறையில் காலக்கெடுவைக் கண்காணிக்கும்.",
    complaintsEmptyBtn: "புகார் பதிவு செய்க",
    trackSla: "SLA கண்காணிப்பு",
    
    // Officer Dashboard
    officerTitle: "மண்டல அதிகாரி",
    officerSub: "மண்டலம் 13 · அடையாறு & வேளச்சேரி குறைதீர் தளம்",
    kpiActive: "செயலில் உள்ளவை",
    kpiBreaches: "SLA காலக்கெடு கடந்தவை (30+ நாட்கள்)",
    kpiRtis: "செயலில் உள்ள RTI-கள்",
    kpiAvgRes: "சராசரி தீர்வு நேரம்",
    kpiWarningTitle: "அதிகாரிகளின் சோதனை சூழல்.",
    kpiWarningBody: "நீங்கள் வார்டு 172-க்கு உட்பட்ட புகார்களைப் பார்க்கிறீர்கள். டெமோவிற்காக பதில்கள் சோதிக்கப்படுகின்றன.",
    tableTitle: "புகார் இணக்கப் பதிவேடு",
    tableColId: "புகார் எண்",
    tableColCat: "வகை",
    tableColSla: "SLA நிலை",
    tableColEscalation: "நகர்வு நிலை",
    tableColAction: "நடவடிக்கை",
    tableSwipeAffordance: "← அட்டவணையை நகர்த்தி விவரங்களைப் பார்க்கவும் →",
    emptyBreachesTitle: "காலக்கெடு கடந்த புகார்கள் இல்லை",
    emptyBreachesSub: "அனைத்து புகார்களும் தீர்க்கப்பட்டுள்ளன அல்லது காலக்கெடுவிற்குள் உள்ளன.",
    
    // Resolution
    resolvedStateLabel: "தீர்க்கப்பட்ட நிலை",
    verifyResolutionTitle: "தீர்வை சரிபார்க்கவும்",
    verifyResolutionSub: "வார்டு அதிகாரி இந்த புகாரைத் தீர்த்துவிட்டதாகக் குறிப்பிட்டுள்ளார். பணி திருப்திகரமாக உள்ளதா என்பதைச் சரிபார்த்து உறுதிப்படுத்தவும்.",
    detailCategory: "புகார் வகை",
    detailDescription: "குடிமகன் அறிக்கை",
    confirmResolvedBtn: "தீர்வை உறுதிசெய்",
    notFixedBtn: "இன்னும் சரி செய்யப்படவில்லை",
    notFixedWarning: "* \"இன்னும் சரி செய்யப்படவில்லை\" என்பதைத் தேர்ந்தெடுப்பது, உயர் நீதிமன்றத்தில் பிரிவு 226 இன் கீழ் மனுவை மீண்டும் செயல்படுத்தி மண்டல அதிகாரிக்கு எச்சரிக்கை அனுப்பும்.",
    verifyingFixLoading: "தீர்வை சரிபார்க்கிறது...",
    registeringFailureLoading: "தோல்வியை பதிவு செய்கிறது...",
    syncLedger: "தரவுப் பதிவேட்டை ஒருங்கிணைக்கிறது...",
    confirmedTitle: "தீர்வு உறுதிசெய்யப்பட்டது",
    confirmedSub: "புகார் வெற்றிகரமாக முடிவுக்குக் கொண்டுவரப்பட்டது. உங்கள் கருத்து பதிவு செய்யப்பட்டுள்ளது.",
    escalatedTitle: "மனு மீண்டும் நகர்த்தப்பட்டது",
    escalatedSub: "புகார் இன்னும் தீர்க்கப்படவில்லை எனக் குறிக்கப்பட்டுள்ளது. சட்டப்பூர்வ நீதி மன்ற மனு மீண்டும் செயல்படத் தொடங்கியது.",
    returningHome: "முகப்பிற்குத் திரும்புகிறது...",
  }
};
