import mongoose from 'mongoose'

const statuses = ['Available', 'In Class', 'College Work', 'Meeting', 'Absent']

const facultySchema = new mongoose.Schema(
  {
    facultyId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    facultyCode: {
      type: String,
      default: '',
      trim: true,
      uppercase: true
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 4
    },
    passwordResetToken: { type: String, default: undefined, select: false },
    passwordResetExpires: { type: Date, default: undefined, select: false },
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      default: '',
      trim: true
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true
    },
    designation: {
      type: String,
      default: 'Faculty',
      trim: true
    },
    area: {
      type: String,
      default: '',
      trim: true
    },
    specialization: {
      type: String,
      default: '',
      trim: true
    },
    qualification: {
      type: String,
      default: '',
      trim: true
    },
    officialRole: {
      type: String,
      default: '',
      trim: true
    },
    alternateEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true
    },
    mainPhone: {
      type: String,
      default: '',
      trim: true
    },
    office: {
      type: String,
      default: '',
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    currentDepartment: {
      type: String,
      default: '',
      trim: true
    },
    teachingDepartment: {
      type: String,
      default: '',
      trim: true,
      uppercase: true
    },
    currentStatus: {
      type: String,
      enum: statuses,
      default: 'Available'
    },
    availabilityDate: {
      type: String,
      default: '',
      trim: true
    },
    availabilityTimeSlot: {
      type: String,
      default: '',
      trim: true
    },
    availabilityStartTime: {
      type: String,
      default: '',
      trim: true
    },
    availabilityEndTime: {
      type: String,
      default: '',
      trim: true
    },
    currentLocation: {
      type: String,
      default: '',
      trim: true
    },
    reason: {
      type: String,
      default: '',
      trim: true
    },
    timetable: {
      type: [
        {
          day: {
            type: String,
            required: true,
            trim: true
          },
          slot: {
            type: String,
            required: true,
            trim: true
          },
          subject: {
            type: String,
            required: true,
            trim: true
          },
          semester: {
            type: String,
            default: '',
            trim: true
          },
          section: {
            type: String,
            default: '',
            trim: true
          },
          block: {
            type: String,
            default: '',
            trim: true
          },
          sharedFaculty: {
            type: String,
            default: '',
            trim: true
          },
          room: {
            type: String,
            default: '',
            trim: true
          }
        }
      ],
      default: []
    }
  },
  { timestamps: { createdAt: false, updatedAt: true } }
)

export { statuses }
export default mongoose.model('Faculty', facultySchema)
