import { TranslationDictionary } from './types';

export const en: TranslationDictionary = {
  app: {
    name: 'First 1,000 Days',
    tagline: 'Your companion for care, support, and guidance',
    subtitle: 'From pregnancy through two years of life'
  },
  nav: {
    today: 'Today',
    ask: 'Ask',
    journey: 'Journey',
    care: 'Care'
  },
  header: {
    changePhaseTitle: 'Change stage or restart quick intro',
    changePhaseAria: 'Restart quick intro'
  },
  onboarding: {
    welcomeBadge: 'Welcome',
    stageBadge: 'Stage',
    focusBadge: 'Initial Focus',
    step1Title: 'Where are you in your journey right now?',
    step1Subtitle: 'We want to provide timely guidance without overwhelming your daily routine.',
    phasePregnancyTitle: "I'm pregnant",
    phasePregnancyDesc: 'Trimester-by-trimester monitoring, self-care, and birth preparation.',
    phaseBabyTitle: 'My baby is born',
    phaseBabyDesc: 'Daily care, infant development, feeding, and routines in the first years.',
    step2Title: 'Which week or month are you in?',
    step2Subtitle: 'This helps us tailor evidence-based content to your exact developmental stage.',
    pregnancyStages: [
      { value: 12, label: 'Early pregnancy (up to 12 weeks)' },
      { value: 24, label: 'Mid-pregnancy (20 to 28 weeks)' },
      { value: 36, label: 'Final weeks (32 to 40 weeks)' }
    ],
    babyStages: [
      { value: 0, label: 'Newborn (first month)' },
      { value: 2, label: '2 to 3 months old' },
      { value: 6, label: '4 to 6 months old' },
      { value: 12, label: '7 to 12 months old' },
      { value: 24, label: 'Toddler (1 to 2 years)' }
    ],
    step3Title: 'What needs the most attention today?',
    step3Subtitle: 'You can change this at any time. Your daily recommendations will prioritize this choice.',
    needs: {
      understand_baby: {
        title: 'Understanding Baby',
        subtitle: 'Crying, sleep, cues, and everyday routines'
      },
      self_care: {
        title: 'Caring for Myself',
        subtitle: 'Rest, emotional health, self-care, and maternal support'
      },
      feeding: {
        title: 'Breastfeeding & Nutrition',
        subtitle: 'Latch, responsive feeding, solids introduction, and nourishment'
      },
      development: {
        title: 'Tracking Development',
        subtitle: 'Milestones, motor skills, stimulation, and discoveries'
      },
      all: {
        title: 'A Little of Everything',
        subtitle: 'Balanced guidance across maternal and child wellbeing'
      }
    },
    nextBtn: 'Continue',
    backBtn: 'Back',
    startBtn: 'Begin with Calm'
  },
  today: {
    badge: 'Today with you',
    greetingPregnancy: 'How are you feeling today?',
    greetingBaby: 'One day at a time',
    phasePrefix: 'Stage',
    focusPrefix: 'Focus',
    checkinBadge: 'Daily Check-in',
    changeAnswerBtn: 'Change answer',
    skipCheckinBtn: 'Skip for today',
    rhythmTitle: 'Your Weekly Rhythm',
    rhythmSubtitle: 'Past 7 days of local records',
    rhythmMom: 'mom self-care',
    rhythmBaby: 'baby milestones',
    rhythmActivities: 'activities practiced',
    rhythmEmpty: 'No records in the last 7 days yet. Complete a check-in or record a memory in your Journey!',
    guideTitle: 'Guidance for Your Day',
    guideSubtitle: 'Tailored to your current stage and what you shared with us today.',
    viewAllCareBtn: 'Explore all care topics',
    verifiedBadge: 'Official Guideline (MS / WHO)',
    demonstrativeBadge: 'Demonstrative',
    activityCompletedToast: 'Activity saved to your Journey!',
    doActivityBtn: 'I practiced this today',
    alreadyDoneBadge: 'Completed today',
    completeModalTitle: 'Log Activity',
    completeModalDesc: 'Would you like to add a note about how putting this guidance into practice went?',
    completeModalPlaceholder: 'E.g., Baby was calm and it was a peaceful moment...',
    completeModalSaveBtn: 'Save to Journey',
    completeModalCancelBtn: 'Cancel'
  },
  care: {
    badge: 'Care Library',
    title: 'Practical Guidance',
    subtitle: 'Recommended actions for your current stage. Once completed, you can log them to your Journey.',
    catAll: 'All',
    catMom: 'Mother & Wellbeing',
    catDevelopment: 'Baby & Development',
    catFeeding: 'Feeding & Nutrition',
    catMonitoring: 'Monitoring',
    catSafety: 'Safety & Prevention',
    doActivityBtn: 'I practiced this activity today',
    activityDoneBadge: 'Completed today',
    sourceLabel: 'Source',
    modalTitle: 'Log Practiced Care',
    modalDesc: 'Upon confirming, this activity will be logged to your Journey timeline.',
    modalPlaceholder: 'How did this care practice go? (optional)',
    modalConfirmBtn: 'Confirm and Save',
    modalCancelBtn: 'Cancel'
  },
  journey: {
    badge: 'Local Timeline',
    title: 'Your Journey',
    subtitle: 'Daily notes, developmental milestones, and memories stored privately on your device.',
    searchPlaceholder: 'Search notes, symptoms, memories...',
    clearSearchBtn: 'Clear search',
    allFilter: 'All',
    babyFilter: '👶 Baby',
    momFilter: '♡ Mother',
    memoryFilter: '📷 Memories',
    countSingle: 'moment shown',
    countPlural: 'moments shown',
    monthOf: ' ',
    prevMonthAria: 'View previous month',
    nextMonthAria: 'View next month',
    emptyMonthTitle: 'No records this month',
    emptyMonthSubtitle: 'Use the "+ New entry" button to log your first moment for this period.',
    emptySearchTitle: 'No records found',
    emptySearchSubtitle: 'Try different search terms or select another month.',
    newRecordBtn: 'New entry',
    closeBtn: 'Close',
    exportMenuBtn: 'Backup & Export Options',
    newRecordTitle: 'New Entry',
    dateSectionTitle: 'When did this happen?',
    dateToday: 'Today',
    dateYesterday: 'Yesterday',
    dateOther: 'Other date...',
    subjectSectionTitle: 'Who are we recording for?',
    subjectOptions: {
      baby: 'Baby',
      mom: 'Mother',
      memory: 'Memory'
    },
    babyPromptTitle: "How was baby's day?",
    momPromptTitle: 'What happened in your journey today?',
    memoryPromptTitle: 'Preserve a moment worth remembering',
    optionsSubtitle: 'Choose one or more options and share a little more.',
    memorySuggestionsSubtitle: 'Inspirational prompts for your memory:',
    memorySuggestions: [
      {
        id: 'first_achievement',
        label: 'First milestone',
        prompt: 'What did your baby do for the very first time?'
      },
      {
        id: 'special_moment',
        label: 'Special moment',
        prompt: 'What made this moment special today?'
      },
      {
        id: 'outing',
        label: 'Outing / Walk',
        prompt: 'Where did you go and what did you discover together?'
      },
      {
        id: 'sounds_laughter',
        label: 'Sound or laughter',
        prompt: 'What new babble, sound, or laugh caught your attention?'
      },
      {
        id: 'sweet_gesture',
        label: 'Tender gesture',
        prompt: 'What cuddle, gaze, or connection warmed your heart?'
      }
    ],
    babyTags: [
      {
        tag: 'Slept well',
        question: 'How were naps or nighttime sleep?',
        placeholder: 'E.g., Slept 2 hours straight without startling...'
      },
      {
        tag: 'Fed normally',
        question: 'Did you notice anything special during feeding?',
        placeholder: 'E.g., Latched calmly and fed without choking...'
      },
      {
        tag: 'Was more fussy or irritable',
        question: 'Did you notice any likely cause for the fussiness?',
        placeholder: 'E.g., Seemed uncomfortable with gas or a growth spurt...'
      },
      {
        tag: 'Had a new discovery or milestone',
        question: 'What gesture, sound, or novelty did you notice?',
        placeholder: 'E.g., Tried grasping the toy with both hands...'
      },
      {
        tag: 'Showed a symptom',
        question: 'Which symptom did you observe closely?',
        placeholder: 'E.g., Mild fever after vaccination, clear runny nose...',
        isRequired: true
      }
    ],
    momTags: [
      {
        tag: 'Had a personal achievement today',
        question: 'What victory of yours deserves to be celebrated?',
        placeholder: 'E.g., Managed to eat lunch sitting down in peace...'
      },
      {
        tag: 'Faced a significant challenge',
        question: 'What made today difficult for you?',
        placeholder: 'E.g., Felt overwhelmed with multiple demands...',
        isRequired: true
      },
      {
        tag: 'Took time just for myself',
        question: 'What did you get to do for yourself?',
        placeholder: 'E.g., Took a relaxing 20-minute bath...'
      },
      {
        tag: 'Had a meaningful conversation',
        question: 'Who did you connect with and how did it help?',
        placeholder: 'E.g., Talked with a friend who also has a baby...'
      },
      {
        tag: 'Received practical help that made a difference',
        question: 'What support relieved your burden today?',
        placeholder: 'E.g., My mom brought over a homecooked meal...'
      },
      {
        tag: 'Observation about my body or recovery',
        question: 'How has your body been responding to recovery and care?',
        placeholder: 'E.g., Backache felt noticeably milder today...'
      }
    ],
    noteLabel: 'Your note:',
    noteGeneralPlaceholder: 'Write a brief note about this moment...',
    saveRecordBtn: 'Save Entry',
    savingRecordBtn: 'Saving...',
    savedSuccessMsg: 'Entry saved successfully!',
    validationChooseOption: 'Please select at least one option before saving.',
    validationDescribeBriefly: (tagName: string) =>
      `For events such as "${tagName}", please write at least a brief description to add context.`,
    exportModalTitle: 'Data Sovereignty',
    exportModalDesc: 'Your records are stored locally on your device. You can export them at any time in open formats.',
    exportJsonTitle: 'Download Backup (.JSON)',
    exportJsonDesc: 'Complete structured file for future restoration',
    exportTxtTitle: 'Download Summary (.TXT)',
    exportTxtDesc: 'Human-readable summary to bring to pediatric visits',
    restoreBtnTitle: 'Restore from File (.JSON)',
    restoreBtnDesc: 'Import a backup previously exported from this app',
    restoreModalTitle: 'Restore Local Backup',
    restoreModalDesc: 'Select a backup file (.json) previously exported by this application.',
    restorePrivacyWarning: 'Privacy Notice: Backup files contain personal health notes and milestones. Store your exported backups only in secure, trusted locations.',
    restoreSelectFileBtn: 'Select .JSON backup file',
    restorePreviewTitle: 'Backup Contents Preview',
    restoreTotalRecords: (n: number) => `${n} valid ${n === 1 ? 'record found' : 'records found'}`,
    restoreDateRange: (min: string, max: string) => `Date range: ${min} to ${max}`,
    restoreCounts: (baby: number, mom: number, memory: number) => `Breakdown: ${baby} baby · ${mom} mother · ${memory} milestones`,
    restoreModeTitle: 'Choose restore strategy:',
    restoreModeMerge: 'Merge without duplication (keeps current records and skips duplicates)',
    restoreModeReplace: 'Replace entire current history (wipes current device records and loads backup)',
    restoreConfirmReplaceWarning: 'Warning: Replacing will permanently delete all existing records on this device before importing.',
    restoreConfirmReplaceCheckbox: 'I understand and explicitly confirm replacing all current history.',
    restoreExecuteBtn: 'Execute Restore',
    restoreCancelBtn: 'Cancel',
    restoreSuccessMsg: (imported: number, skipped: number) =>
      `Restore completed! ${imported} records successfully imported${skipped > 0 ? ` (${skipped} duplicate records skipped)` : ''}.`,
    restoreErrorTitle: 'File validation failed:',
    clearAllDataBtn: 'Delete all records from this device...',
    clearModalTitle: 'Confirm Deletion',
    clearModalQuestion: 'Are you sure you want to delete all IndexedDB records from this device?',
    clearModalWarning: 'Warning: Because data is saved only on your local device, deletion is irreversible unless you exported a JSON backup first.',
    clearModalCancelBtn: 'Cancel',
    clearModalConfirmBtn: 'Yes, delete everything',
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    dateTodayPrefix: 'Today',
    dateYesterdayPrefix: 'Yesterday'
  },
  ask: {
    badge: 'Educational Assistant',
    title: 'Ask Questions',
    subtitle: 'Evidence-based answers grounded in official health guidelines (WHO and Ministry of Health).',
    disclaimerTitle: 'Health Notice:',
    disclaimerText: 'This assistant is strictly for educational and informational purposes. It does not replace in-person pediatric consultations, clinical diagnosis, or medical care.',
    commonQuestionsTitle: 'Common questions for this stage:',
    sampleQuestionsPregnancy: [
      'Is excessive fatigue normal during the first trimester?',
      'Which foods should be avoided during pregnancy?',
      'How can I identify the earliest signs of labor?'
    ],
    sampleQuestionsBaby: [
      'Is frequent hiccuping after feeding dangerous for a 2-month-old?',
      'How can I tell if the breastfeeding latch is correct?',
      'How many hours of sleep are expected at this age?'
    ],
    inputTitle: 'Your question:',
    inputPlaceholder: 'E.g., How to comfort a 2-month-old baby with colic?',
    sourcesNotice: 'Sources: MS / WHO',
    consultBtn: 'Ask Assistant',
    consultingBtn: 'Searching guidelines...',
    statusNoticeTitle: 'Stage 4A (Active):',
    statusNoticeDesc: 'Decoupled Edge Gateway active in Mock Mode (zero cost). Grounded answers with verified official guideline citations.',
    alertComingSoon: 'Interface structure ready! Connection to educational AI with source citation is active in Stage 4A.',
    inputLimitHint: (cur: number, max: number) => `${cur}/${max} characters`,
    piiNotice: 'For safety and privacy, do not enter full names, IDs, or phone numbers. Automated filtering cannot guarantee 100% anonymization.',
    emergencyAlertTitle: 'Urgent Medical Notice',
    emergencyPhoneLabel: 'Immediate Emergency Contact:',
    outOfCatalogTitle: 'Responsible Guidance (Outside Official Catalog)',
    citationsTitle: 'Verified Official Guidelines Consulted:',
    modeMockBadge: 'Demonstration Mode (Local Simulation)',
    modeLiveBadge: 'Gemini 3.5 Flash-Lite (Official)',
    mockNoticeText: 'This educational response was simulated locally from official guidelines. No external paid AI calls were made.',
    errorCardTitle: 'Service Temporarily Unavailable',
    newConsultationBtn: 'Ask another question',
    verifiedGuidelineBadge: 'Verified Official Guideline',
    pendingReviewBadge: 'Under Clinical Review',
    viewSourcesBtn: 'View sources',
    hideSourcesBtn: 'Hide sources',
    sourcesCount: (n: number) => `(${n} source${n > 1 ? 's' : ''})`,
    jurisdictionBR: 'Reference National Protocol: Brazil (Ministry of Health of Brazil / Ministério da Saúde)',
    jurisdictionGlobal: 'Global Guideline: World Health Organization (WHO / UNICEF)',
    officialLinkText: 'Access official publication',
    emergencyCallSAMU: 'Call Emergency 192 (Brazil)',
    emergencyIntlNotice: 'Emergency guidance references the Brazilian protocol (SAMU 192). If outside Brazil, contact your local emergency services (e.g., 911, 112, 999) immediately.',
    offlineNotice: 'You are currently offline. The assistant requires network access to query the gateway, but the Care Library is 100% available on your device.'
  },
  common: {
    loading: 'Loading local data...',
    dbErrorTitle: 'Local Storage Restricted',
    dbErrorDesc: 'IndexedDB could not be initialized in this browser. New records will not be saved.',
    saveError: 'Unable to save to device storage.',
    clearError: 'Error deleting local records.',
    confirmPhaseReset: 'Would you like to change your stage or restart the quick introduction?'
  }
};
