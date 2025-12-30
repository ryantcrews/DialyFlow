import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { patientService } from '../services/patient.service';
import { visitService, commentService } from '../services/visit.service';
import { Patient, Visit, Comment } from '@dialyflow/shared';

interface VisitForm {
  recordCompleted: boolean;
  carePlanDone: boolean;
  cipaDone: boolean;
  billingCodes: string;
  referrals: string;
}

export default function PatientRecordPage() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [todayVisit, setTodayVisit] = useState<Visit | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const visitType = localStorage.getItem('visitType') || 'in-person';

  const { register, handleSubmit, reset } = useForm<VisitForm>();

  useEffect(() => {
    if (patientId) {
      loadData();
    }
  }, [patientId]);

  const loadData = async () => {
    try {
      const patientData = await patientService.getById(patientId!);
      setPatient(patientData);

      // Check for today's visit
      const today = new Date().toISOString().split('T')[0];
      const visits = await visitService.getPatientVisits(patientId!);
      const todaysVisit = visits.find(
        (v) => v.visitDate.toString().split('T')[0] === today
      );

      if (todaysVisit) {
        setTodayVisit(todaysVisit);
        reset({
          recordCompleted: todaysVisit.recordCompleted,
          carePlanDone: todaysVisit.carePlanDone,
          cipaDone: todaysVisit.cipaDone,
          billingCodes: todaysVisit.billingCodes.join(', '),
          referrals: todaysVisit.referrals.join(', '),
        });

        // Load comments
        const commentsData = await commentService.getByVisit(todaysVisit._id);
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: VisitForm) => {
    try {
      setSaving(true);

      const visitData = {
        recordCompleted: data.recordCompleted,
        carePlanDone: data.carePlanDone,
        cipaDone: data.cipaDone,
        billingCodes: data.billingCodes
          .split(',')
          .map((c) => c.trim())
          .filter((c) => c),
        referrals: data.referrals
          .split(',')
          .map((r) => r.trim())
          .filter((r) => r),
      };

      if (todayVisit) {
        await visitService.update(todayVisit._id, visitData);
      } else {
        await visitService.create({
          patient: patientId!,
          visitDate: new Date(),
          visitType: visitType as any,
          unit: patient!.unit,
          shift: patient!.shift,
          ...visitData,
        });
      }

      alert('Visit record saved successfully!');
      loadData();
    } catch (error) {
      console.error('Failed to save visit:', error);
      alert('Failed to save visit record');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      let visitId = todayVisit?._id;

      if (!visitId) {
        // Create visit first
        const visit = await visitService.create({
          patient: patientId!,
          visitDate: new Date(),
          visitType: visitType as any,
          unit: patient!.unit,
          shift: patient!.shift,
        });
        visitId = visit._id;
        setTodayVisit(visit);
      }

      await commentService.create({
        visit: visitId,
        patient: patientId!,
        text: newComment,
      });

      setNewComment('');
      loadData();
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading patient record...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Patient not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary-600">DialyFlow</h1>
            <button onClick={() => navigate(-1)} className="btn btn-secondary">
              Back to Patient List
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card mb-6">
          <h2 className="text-2xl font-bold mb-4">Patient Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">
                {patient.firstName} {patient.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date of Birth</p>
              <p className="font-medium">
                {new Date(patient.dateOfBirth).toLocaleDateString()}
              </p>
            </div>
            {patient.medicalRecordNumber && (
              <div>
                <p className="text-sm text-gray-600">MRN</p>
                <p className="font-medium">{patient.medicalRecordNumber}</p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card mb-6">
          <h2 className="text-2xl font-bold mb-6">Visit Documentation</h2>

          <div className="space-y-4 mb-6">
            <label className="flex items-center gap-3">
              <input type="checkbox" {...register('recordCompleted')} className="w-5 h-5" />
              <span className="font-medium">Record Completed</span>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" {...register('carePlanDone')} className="w-5 h-5" />
              <span className="font-medium">Care Plan Done - Weekly Note</span>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" {...register('cipaDone')} className="w-5 h-5" />
              <span className="font-medium">CIPA Done - Monthly Note</span>
            </label>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block font-medium mb-2">Billing Codes</label>
              <input
                type="text"
                {...register('billingCodes')}
                placeholder="Enter codes separated by commas"
                className="input"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Referrals</label>
              <input
                type="text"
                {...register('referrals')}
                placeholder="Enter referrals separated by commas"
                className="input"
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary w-full">
            {saving ? 'Saving...' : 'Save Visit Record'}
          </button>
        </form>

        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Comments</h2>

          <div className="mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="input min-h-[100px]"
            />
            <button
              type="button"
              onClick={handleAddComment}
              className="btn btn-primary mt-2"
            >
              Add Comment
            </button>
          </div>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No comments yet</p>
            ) : (
              comments.map((comment: any) => (
                <div key={comment._id} className="border-t pt-4">
                  <p className="text-gray-800">{comment.text}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {comment.author?.firstName} {comment.author?.lastName} -{' '}
                    {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
